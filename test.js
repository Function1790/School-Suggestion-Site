const School = require('school-kr');
const school = new School();

const print = (t) => console.log(t)

//N100000176

;(async () =>{
    school.init(School.Type.HIGH, School.Region.CHUNGNAM, 'N100000176');
    const data = await school.getMeal(2023,5,2)
    print(data)
})()
