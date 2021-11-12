const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
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

const pro = new MyPromise((resolve, reject) => {
    throw 123
})
