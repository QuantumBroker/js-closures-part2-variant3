/**
 * Створює ледачу обгортку для відкладеного обчислення однієї функції.
 * @param {function} fn - Функція для відкладеного виконання.
 * @returns {function} Функція, яка обчислить результат лише при першому виклику.
 */
function lazy(fn) {
    let evaluated = false;
    let result;

    return function(...args) {
        if (!evaluated) {
            result = fn(...args);
            evaluated = true;
        }
        return result;
    };
}

/**
 * Конструктор ледачих послідовностей (Lazy Evaluation Chain) з підтримкою нескінченних даних.
 * @param {function*|iterable} source - Джерело даних (генератор або масив).
 * @returns {object} Об'єкт із ланцюжковим (Chainable) API.
 */
function createLazyChain(source) {
    // Внутрішня функція для отримання ітератора з джерела
    const getIterator = () => {
        if (typeof source === "function" && source.constructor.name === "GeneratorFunction") {
            return source();
        }
        return source[Symbol.iterator]();
    };

    return {
        /**
         * Ледаче відображення елементів (трансформація).
         */
        lazyMap(mapFn) {
            const iterator = getIterator();
            const generator = function* () {
                for (const item of iterator) {
                    yield mapFn(item);
                }
            };
            return createLazyChain(generator);
        },

        /**
         * Ледаче фільтрування елементів за умовою.
         */
        lazyFilter(predicateFn) {
            const iterator = getIterator();
            const generator = function* () {
                for (const item of iterator) {
                    if (predicateFn(item)) {
                        yield item;
                    }
                }
            };
            return createLazyChain(generator);
        },

        /**
         * Отримання перших N елементів послідовності (викликає реальні обчислення).
         */
        take(n) {
            const result = [];
            const iterator = getIterator();
            for (let i = 0; i < n; i++) {
                const next = iterator.next();
                if (next.done) break;
                result.push(next.value);
            }
            return result;
        },

        /**
         * Повне виконання обчислень для всієї послідовності (не підходить для нескінченних джерел).
         */
        evaluate() {
            const result = [];
            const iterator = getIterator();
            for (const item of iterator) {
                result.push(item);
            }
            return result;
        }
    };
}

/**
 * Нескінченний генератор послідовності цілих чисел (джерело для тестування).
 */
function* infiniteNumbers() {
    let current = 1;
    while (true) {
        yield current++;
    }
}


// Автоматична демонстрація роботи системи ледачих обчислень
console.log("=== Результати роботи системи ледачих обчислень ===");

console.log("\n1. Перевірка базової відкладеної функції (lazy):");
let counter = 0;
const heavyTask = () => {
    counter++;
    return 42;
};

const getLazyValue = lazy(heavyTask);
console.log("Функцію обгорнуто. Лічильник виконання:", counter);
console.log("Перший запит значення:", getLazyValue());
console.log("Другий запит значення:", getLazyValue());
console.log("Фінальний лічильник реальних обчислень:", counter);

console.log("\n2. Перевірка ланцюжкових трансформацій на скінченному масиві:");
const baseArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const arrayChain = createLazyChain(baseArray)
    .lazyMap(x => x * 10)
    .lazyFilter(x => x > 40);

console.log("Ланцюжок створено, але обчислення ще не розпочато.");
console.log("Результат виконання через метод evaluate():", arrayChain.evaluate());

console.log("\n3. Робота з нескінченною послідовністю чисел:");
const infiniteChain = createLazyChain(infiniteNumbers)
    .lazyFilter(x => x % 2 === 0)      // Тільки парні числа
    .lazyMap(x => x * x)              // Піднесення до квадрату
    .lazyFilter(x => x % 3 === 0);     // Діляться на 3

console.log("Отримання перших 5 результатів обробки з нескінченного потоку даних:");
console.log(infiniteChain.take(5));

console.log("\n4. Вимірювання продуктивності (Benchmark):");
// Створюємо великий масив на 500,000 елементів
const bigArray = Array.from({ length: 500000 }, (_, i) => i);

const start = performance.now();
// Навіть на такій кількості даних ледачі операції відпрацюють миттєво, бо метод take(10) рахує тільки перші 10 збігів
const benchmarkResults = createLazyChain(bigArray)
    .lazyMap(x => x * 2)
    .lazyFilter(x => x % 5 === 0)
    .take(10);
const end = performance.now();

console.log("Перші 10 результатів з великого масиву:", benchmarkResults);
console.log(`Час виконання ледачих операцій (take) на 500,000 елементах: ${(end - start).toFixed(4)} мс`);