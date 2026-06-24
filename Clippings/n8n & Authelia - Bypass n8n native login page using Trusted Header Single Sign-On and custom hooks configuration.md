---
aliases: []
author:
created: 2025-08-13

date: 02-11-2025
description: "FROM V1.87.0 ONWARDS, PLEASE USE THIS SNIPPET INSTEADconst { dirname, resolve } = require('path')const Layer = require('router/lib/layer')const { issue..."
dg-publish: true
parent:
published: 2024-04-18
source: "https://kb.jarylchng.com/i/n8n-and-authelia-bypass-n8n-native-login-page-usin-sNRmS-7j5u1/"
summary:
tags:
  - "clippings"
title: "n8n & Authelia - Bypass n8n native login page using Trusted Header Single Sign-On and custom hooks configuration"
type: 📄note
---

# From v1.87.0 onwards, please use this snippet instead

```javascript
const { dirname, resolve } = require('path')
const Layer = require('router/lib/layer')
const { issueCookie } = require(resolve(dirname(require.resolve('n8n')), 'auth/jwt'))
const ignoreAuthRegexp = /^\/(assets|healthz|webhook|rest\/oauth2-credential)/
module.exports = {
    n8n: {
        ready: [
            async function ({ app }, config) {
                const { stack } = app.router
                const index = stack.findIndex((l) => l.name === 'cookieParser')
                stack.splice(index + 1, 0, new Layer('/', {
                    strict: false,
                    end: false
                }, async (req, res, next) => {
                    // skip if URL is ignored
                    if (ignoreAuthRegexp.test(req.url)) return next()

                    // skip if user management is not set up yet
                    if (!config.get('userManagement.isInstanceOwnerSetUp', false)) return next()

                    // skip if cookie already exists
                    if (req.cookies?.['n8n-auth']) return next()

                    // if N8N_FORWARD_AUTH_HEADER is not set, skip
                    if (!process.env.N8N_FORWARD_AUTH_HEADER) return next()

                    // if N8N_FORWARD_AUTH_HEADER header is not found, skip
                    const email = req.headers[process.env.N8N_FORWARD_AUTH_HEADER.toLowerCase()]
                    if (!email) return next()

                    // search for user with email
                    const user = await this.dbCollections.User.findOneBy({email})
                    if (!user) {
                        res.statusCode = 401
                        res.end(`User ${email} not found, please have an admin invite the user first.`)
                        return
                    }

                    // issue cookie if all is OK
                    issueCookie(res, user)
                    return next()
                }))
            },
        ],
    },
}
```

I use Authelia as my SSO solution for my home services, however after n8n released v1.0, they seem to have removed Basic Authentication and locked SAML and OIDC behind an enterprise license. They seem to have removed the options to disable user management completely as well. I do believe they have never supported [Trusted Header SSO](https://www.authelia.com/integration/trusted-header-sso/introduction/) even before v1.0.

My main goal was to avoid the need to key in 2 sets of credentials every time (Authelia and n8n), and to have a more seamless SSO experience by bypassing the n8n login page.

# Solution

> I would not have easily found this solution without the help of [@MutedJam and @netroy on the N8N community forum](https://community.n8n.io/t/self-hosted-user-management/30520/4).

With the help of the `n8n.ready` [backend external hook](https://docs.n8n.io/embed/configuration/#backend-hooks), we are able to intercept and add another middleware to issue a JWT authentication token when the header is detected.

# Assumptions

- n8n is hosted using Docker
- [Your reverse proxy is setting and forwarding the Remote-Email header from Authelia](https://www.authelia.com/integration/trusted-header-sso/introduction/#forwarding-the-response-headers)
- n8n is already secured by Authelia on a reverse proxy

> Remote-Email is used by majority of the reverse proxy guides on Authelia documentation, if you did not customize much, it should be the same.

# Instructions

## Ensure your user's e-mail matches Authelia

Make sure to change it to match your LDAP store or [flat file](https://github.com/authelia/authelia/blob/master/examples/compose/lite/authelia/users_database.yml#L15) depending on your Authelia configuration.

## Creating the External Hook file

Create a file named \`hooks.js\` and place this file somewhere your n8n instance can reach.

In the case of the official Docker image, it is where you mounted \`/home/node/\` to, and for the sake of this guide, I will place it at where it would be effectively mounted at \`/home/node/.n8n/hooks.js\`.

Copy and paste the following into the file:

```javascript
const { dirname, resolve } = require('path')
const Layer = require('express/lib/router/layer')
const { issueCookie } = require(resolve(dirname(require.resolve('n8n')), 'auth/jwt'))
const ignoreAuthRegexp = /^\/(assets|healthz|webhook|rest\/oauth2-credential)/
module.exports = {
    n8n: {
        ready: [
            async function ({ app }, config) {
                const { stack } = app._router
                const index = stack.findIndex((l) => l.name === 'cookieParser')
                stack.splice(index + 1, 0, new Layer('/', {
                    strict: false,
                    end: false
                }, async (req, res, next) => {
                    // skip if URL is ignored
                    if (ignoreAuthRegexp.test(req.url)) return next()

                    // skip if user management is not set up yet
                    if (!config.get('userManagement.isInstanceOwnerSetUp', false)) return next()

                    // skip if cookie already exists
                    if (req.cookies?.['n8n-auth']) return next()

                    // if N8N_FORWARD_AUTH_HEADER is not set, skip
                    if (!process.env.N8N_FORWARD_AUTH_HEADER) return next()

                    // if N8N_FORWARD_AUTH_HEADER header is not found, skip
                    const email = req.headers[process.env.N8N_FORWARD_AUTH_HEADER.toLowerCase()]
                    if (!email) return next()

                    // search for user with email
                    const user = await this.dbCollections.User.findOneBy({email})
                    if (!user) {
                        res.statusCode = 401
                        res.end(\`User ${email} not found, please have an admin invite the user first.\`)
                        return
                    }

                    // issue cookie if all is OK
                    issueCookie(res, user)
                    return next()
                }))
            },
        ],
    },
}
```

## Configure extra Docker container environment variables

Ensure to append a 2 new environment variable to your n8n instance and re-create the container depending on how you deployed it:

```javascript
EXTERNAL_HOOK_FILES=/home/node/.n8n/hooks.js
N8N_FORWARD_AUTH_HEADER=Remote-Email
```

Reference: [Registering hooks with EXTERNAL\_HOOK\_FILES](https://docs.n8n.io/embed/configuration/#registering-hooks)

# Precautions

Make sure to secure n8n properly by making it only accessible via your reverse proxy. Do not allow direct access as any user would be able to impersonate someone by sending a custom \`Remote-Email\` header if so.

# Afterword

It seems that it is likely possible to re-create a whole SAML/OIDC set-up just by implementing it in the hook, but it is definitely a project on its own and definitely out of scope for this post. However, you are free to customize the script however you wish according to your needs. There is likely a way to automatically create users as well, but I have yet to really dig into the n8n codes.

I've really only tested this on Nginx, but it should be reverse proxy agnostic.

If you would like another workflow automation software that does not gate OIDC (at least for the first 10 users) with a license, you could look at [Windmill](https://www.windmill.dev/).
