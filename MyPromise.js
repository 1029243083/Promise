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

// const pro = new MyPromise((resolve, reject) => {
//     throw 123
// })


runMicroTask(() => {
    console.log("sss")
})

setTimeout(() => { console.log(1) });

console.log(2)