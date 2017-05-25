function randomTask() {
    return new Promise((resolve, reject) => {
            const taskResult = Math.round(Math.random() * 10);
            setTimeout(() => {
                resolve(taskResult);
            }, 1000);
    });
}


function addTask(arg1, arg2) {
    return new Promise( (resolve, reject) => {
        const result = arg1 + arg2;
        setTimeout(()=>{
            resolve(result);
            // reject('error');
        }, 1000);
    });
}

async function doIt() {
    try {
        let r1 = await randomTask();
        let r2 = await randomTask();
        let sum = await addTask(r1, r2);
        console.log('Random Numbers : ', r1, r2);
        console.log('DoIt finish, sum =', sum);
        return sum;
    } catch (error) {
        console.log('Task Failure', error);
        throw error;
    }
}

async function runTask() {
    try {
        let ret = await doIt();
        console.log('Run Task Ret : ', ret);
    }
    catch ( error ) {
        console.log('Run Task Error :', error);
    }
}

runTask();