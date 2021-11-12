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
        return new Promise((resolve, reject) => {
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
        console.log(this._handles.length)
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
}

const pro = new MyPromise((resolve, reject) => {
    resolve(1)
})

pro.then(() => {
    console.log(1)
}, () => { })
setTimeout(() => {
    pro.then(() => { console.log(999) })
})

console.log(pro)