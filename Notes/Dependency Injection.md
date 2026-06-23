---
aliases:
  - принцип внедрения зависимостей
date: 20-11-2025
dg-publish: true
parent:
summary: Принцип построение архитектуры, для снижения связанности кода, путем  внешнего управления зависимостями.
tags: []
type: 📄note
🖥️IT:
  - OOP
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

> [!important] Ключевой смысл
вместо прямого указания зависимостей класса, передавать зависимости в виде аргументов конструктора

> [!success] Реализуется через интерфейсы
описать необходимую зависимость в интерфейсе, а после в точке сборки подать подходящую зависимость в соответствии с этим интерфейсом

> [!$] Цель
> - Уменьшение связанности кода
> - Проще расширять, т.к. нужно только изменить точку сборки, а не влезать в класс
> - Упрощение тестирование, т.к. проще прокидывать моки

# Примеры

## Без DI

```TypeScript
class Module {
	private userService = new UserService() // Прямое объявление зависимоси
	// Классы Module и UserService теперь четко связаны
	constructor() {}
}
```

## С DI

```TypeScript 
// module.ts
class Module {
	private userService: IUserService // здесь просто указывается, что это поле требует зависимость типа IUserService, но не объявляем напрямую 
	
	constructor(userService: IUserService) {
		this.userService = userService // А здесь уже передаем зависимость 
	}
}
// init.ts
const userService = new UserService()
const module = new Module(userService) // внедряем зависимость
```
