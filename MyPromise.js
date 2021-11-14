const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

/**
 * 
 * @param {Function} callback
 * 把函数添加到微队列中 
 */
function runMicroTask(callback) {
    // node环境
    if (process && process.nextTick) {
        process.nextTick(callback);
    } else if (MutationObserver) {
        const p = document.createElement("p");
        const observer = new MutationObserver(callback);
        observer.observe(p, { childList: true });
        p.innerHTML = "1";
    } else {
        setTimeout(callback, 0);
    }
}

function isPromise(obj) {
    return !!(obj && typeof obj === 'object' && typeof obj.then === 'function');
}

class MyPromise {
    constructor(execute) {
        this._state = PENDING; // Pormise的状态
        this._value = undefined; // Pormise的数据
        this._handles = []; //任务队列的数组
        try {
            // 立即执行new Promise传入的函数,如果执行函数发生错误，直接失败
            execute(this._resolve.bind(this), this._reject.bind(this)); //bind改变this指向
        } catch (error) {
            this._reject(error)
        }
    }

    /**
     * 
     * @param {Function} onFulFilledFun 
     * @param {Function} onRecjecedFun 
     * return Promise
     */
    then(onFulFilledFun, onRecjecedFun) {
        return new MyPromise((resolve, reject) => {
            this._pushOneHandle(onFulFilledFun, FULFILLED, resolve, reject)
            this._pushOneHandle(onRecjecedFun, REJECTED, resolve, reject)
            this._runHandles(); //执行队列
        })
    }

    /**
     * 执行任务队列的函数
     * @returns undefined
     */
    _runHandles() {
        if (this._state === PENDING) return;
        while (this._handles[0]) {
            const handle = this._handles[0]
            this._runOneHandle(handle);
            this._handles.shift();
        }
    }

    /**
     * 处理单个任务函数
     * @param {Function} handle 
     */
    _runOneHandle(handle) {
        runMicroTask(() => {
            // 如果当前状态和handle里的状态不一致，就不处理
            if (this._state !== handle.state) return;

            if (typeof handle.execute !== "function") {
                // 如果then参数传递的不是一个函数，状态穿透，上一个Promise是啥，then返回的Promise的状态就是啥
                this._state === FULFILLED ? handle.resolve(this._value) : handle.reject(this._value);
                return;
            }
            try {
                const res = handle.execute.call(this, this._value);
                if (isPromise(res)) { // 如果返回的是Promise，根据返回的Promise的状态来决定，当前then返回的Promise的状态
                    res.then((value) => {
                        handle.resolve(value);
                    }, (resone) => {
                        handle.reject(resone)
                    })
                } else {
                    handle.resolve.call(this, res)
                }
            } catch (error) {
                handle.reject(error);
            }
        })
    }

    /**
     * 
     * @param {Function} execute 处理函数
     * @param {String} state 执行函数时，这个函数在那个状态下执行
     * @param {Function} resolve then返回Promise，是返回的那个Promise的resolve，因为只有在执行处理函数的时候才知道，返回的这个Promise是否完成
     * @param {Function} reject 跟上面一样 
     */
    _pushOneHandle(execute, state, resolve, reject) {
        this._handles.push({
            execute,
            state,
            resolve,
            reject
        })
    }

    /**
     * 改变Promise的状态，和数据
     * @param {String} newState 
     * @param {any} data 
     */
    _stateChange(newState, data) {
        if (this._state !== PENDING) return;
        this._state = newState;
        this._value = data;
        this._runHandles();
    }

    /**
     * 改变Promise的状态，和数据
     * @param {any} data 
     */
    _resolve(data) {
        this._stateChange(FULFILLED, data);
    }

    /**
     * 改变Promise的状态，和数据
     * @param {any} data 
     */
    _reject(data) {
        this._stateChange(REJECTED, data);
    }

    /**
     * 方法返回一个以给定值解析后的Promise 对象。如果这个值是一个 promise ，那么将返回这个 promise 
     * @param {any} value 
     */
    static resolve(value) {
        if (value instanceof Promise) {
            return value;
        }
        if (isPromise(value)) {
            return value;
        }
        return new MyPromise((resolve, reject) => {
            reject(value)
        })
    }

    /**
     * 方法返回一个带有拒绝原因的Promise对象。
     * @param {any} reason 
     */
    static reject(reason) {
        return new MyPromise((resolve, reject) => {
            reject(reason)
        })
    }

    /**
     * 返回一个Promise，当数组里的promise全部完成，返回的Promise完成，如果有一个失败，返回的Promise失败，then的数据必须是有序的
     * @param {MyPromise[]} promises 
     */
    static all(promises) {
        return new MyPromise((resolve, reject) => {
            const values = [];
            let count = 0; // 有多少个promise
            let fulfilledCount = 0; // 有多个成功了
            for (const p of promises) {
                let i = count;
                count++; // 循环一次代表有一个promise
                MyPromise.resolve(p).then(data => {
                    fulfilledCount++; // 进入then表示有一个promise成功了
                    values[i] = data;
                    if (fulfilledCount === count) {
                        resolve(values)
                    }
                }, (reason) => {
                    reject(reason);
                })
            }

        })
    }

    /**
     * 方法返回一个在所有给定的promise都已经fulfilled或rejected后的promise，并带有一个对象数组，每个对象表示对应的promise结果。
     * @param {MyPromise[]} promises 
     */
    static allSettled(promises) {
        const ps = [];
        for (const p of promises) {
            ps.push(
                MyPromise.resolve(p).then(
                    function (data) {
                        return {
                            status: FULFILLED,
                            data
                        }
                    },
                    function (reason) {
                        return {
                            status: REJECTED,
                            reason
                        }
                    }
                )
            )
        }
        return MyPromise.all(ps)
    }

    /**
     * 返回promise，看传入的promis，谁先完成，返回的promise就是哪个状态
     * @param {iterable} iterable 
     */
    static race(iterable) {
        return new MyPromise((resolve, reject) => {
            for (const p of iterable) {
                p.then(resolve, reject)
            }
        })
    }

    toString() {
        return `Promise { <${this._state}> }`
    }


}

const promise1 = new MyPromise((resolve, reject) => {
    setTimeout(resolve, 10, 'one');
});

const promise2 = new MyPromise((resolve, reject) => {
    setTimeout(reject, 100, 'two');
});

Promise.race([promise1, promise2]).then((value) => {
    console.log(value);
    // Both resolve, but promise2 is faster
}, err => { console.log(err) });

// const pro1 = new MyPromise((resolve) => { setTimeout(() => { resolve(1) }, 100) })
// const pro2 = new MyPromise((resolve, reject) => { reject(2) })
// const pro3 = new MyPromise((resolve) => { resolve(3) })
// const pro4 = new MyPromise((resolve) => { resolve(4) })

// const all = MyPromise.allSettled([pro1, pro2, pro3, 1])
// all.then(res => { console.log(res) },
//     reason => { console.log(reason) })