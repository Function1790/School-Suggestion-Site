
const TIME_ZONE = 9 * 60 * 60 * 1000; // 9시간

let a=new Date((new Date().getTime())+TIME_ZONE).toISOString().replace('T', ' ').slice(0, -5)
console.log(a)