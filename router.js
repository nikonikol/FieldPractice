/**
 * router.js路由模块
 * 职责
 *  处理登陆功能路由
 *  根据不同请求响应url
 */
//Excle
const xlsx = require('node-xlsx')
//加载文件
var fs = require('fs')
//加载express，包装路由
var express = require('express')
//加载mysql.js
var mysql = require('./models/mysql')
//加载md5插件
var md5 = require('blueimp-md5')
//创建一个路由容器
var router = express.Router()

function mypinfoquery(sql) {
    return new Promise(function (resolve, reject) {
        mysql(sql, (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(data)
        })
    })
}

/*
*
//将登陆路由挂载到router容器里
*
*/


/* 登陆路由*/
//渲染登陆页面
router.get('/', function (req, res) {
    res.render('login.html')
})

//登录请求
router.post('/', function (req, res) {
    //获取请求体
    var userid = req.body.UserId
    var password = req.body.Password
    var sql = null
    //匹配登陆账号和密码
    try {
        sql = `SELECT
        studentinfo.UserId,
        studentinfo.Password,
        studentinfo.NickName,
        studentinfo.Icon,
        studentinfo.Class,
        studentinfo.Role
    FROM
        studentinfo
    WHERE
        studentinfo.UserId="` + userid + `" AND
        studentinfo.Password="` + password + `"
        `
        mysql(sql, function (err, data) {

            if (err) {

                return res.status(500).json({
                    err_code: 500,
                    message: err.message
                })
            }
            // 如果账号和密码匹配，则 Userinformation 是查询到的用户对象，否则就是 null
            if (!data) {
                return res.status(200).json({
                    //提供错误码
                    err_code: 1,
                    message: 'nickname or password is invalid.'
                })
            } else {
                req.session.Userinformation = data
                // 用户存在，登陆成功，通过 Session 记录登陆状态
                res.status(200).json({
                    err_code: 0,
                    message: 'OK'
                })
            }

        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            err: err.message,
            message: ''
        })
    }
})

//统计数据
router.post('/chartsdisplay', function (req, res) {
    const teacherclass= req.session.Userinformation[0].Class.split(',') 
    var studentgrade=new Array
    
    var sum = function(x,y){ return x+y;};　　//求和函数
    var square = function(x){ return x*x;};　　//数组中每个元素求它的平方
    var querysult =new Array
    

    ;(async()=>{
        try{
            for(i=0;i<teacherclass.length;i++){
                sql = `
                    SELECT
                    studentinfo.Class,
                    studentinfo.NickName,
                    studentinfo.Name,
                    studentinfo.UserId,
                    testresult.FinallyGrade
                    FROM
                    studentinfo,
                    testresult
                    WHERE
                    studentinfo.Class = '` + teacherclass[i] + `' 
                    ORDER BY
                    testresult.FinallyGrade ASC

                `

                studentgrade[i]=  await mypinfoquery(sql)
                var studentgradelist =new Array
                for(k=0;k<studentgrade[i].length;k++){
                    
                    
                    if(studentgrade[i][0]!=undefined){
                        studentgradelist[k]=studentgrade[i][k].FinallyGrade
                    }
                    
                   
                }
                querysult[i]=studentgradelist
                //console.log( querysult[i])
                // if(querysult[0]==undefined){
                //     return
                // }
                //studentgrade[i]=querysult[i].FinallyGrade
                //console.log(querysult[0].FinallyGrade, querysult[querysult.length-1].FinallyGrade)
                //studentgrade
            }

            for(j=0;j<querysult.length;j++){
                if(querysult[j][0]!=undefined){
                    var mean = querysult[j].reduce(sum)/querysult[j].length
            var deviations = querysult[j].map(function(x){return x-mean;})
            var stddev = Math.sqrt(deviations.map(square).reduce(sum)/(querysult[j].length-1));
            var max = Math.max.apply(null,querysult[j])
            var min = Math.min.apply(null,querysult[j])

            if (querysult[j].length%2==0){
                mid = (querysult[j][querysult[j].length/2]+querysult[j][querysult[j].length/2+1])/2
            }
            if (querysult[j].length%2!=0){
                mid = querysult[j][(querysult[j].length+1)/2]
            }
             console.log(mean+"平均数 ")
            console.log(deviations+"deviations ")
            console.log(stddev+"方差 ")
            console.log(max+"最大值 ")
            console.log(min+"最小值 ")
            console.log(mid+"中位数 ")
                }

          
                
            }
            
        }

        catch(e){
            console.log(e.message)
            res.status(500).json({
                code: 2,
                err: e.message,
                message: ''
            })
        }
        
    })()

 })
 
/* index路由*/
router.get('/index', function (req, res) {

    //渲染页面
    if (req.session.Userinformation === null || req.session.Userinformation === undefined) {
        return res.redirect('/')
    }

    var teacherclass = req.session.Userinformation[0].Class
    var teacherclass = teacherclass.split(',')
    var userid = req.session.Userinformation[0].UserId
    try {

        sql = `SELECT
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskState,
        tasktable.TaskContent
        FROM
        tasktable
        WHERE
        tasktable.Sponsor="` + userid + `"
    `
        mysql(sql, function (err, data) {
            if (err) {
                return res.status(500).json({
                    err_code: 500,
                    message: err.message
                })
            }
            Taskinformation = data
            for (j = 0; j < data.length; j++) {
                Taskinformation[j].FromTime = Taskinformation[j].FromTime.toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, '');
                Taskinformation[j].EndTime = Taskinformation[j].EndTime.toLocaleString().replace(/[年月]/g, '-').replace(/[日上下午]/g, '');
            }
            var studentarry = new Array
            var istrue = 0
            for (i = 0; i < teacherclass.length; i++) {

                sqlclass = `
                SELECT
                studentinfo.Class,
                studentinfo.NickName,
                studentinfo.Name,
                studentinfo.UserId
                FROM
                studentinfo
                WHERE
                studentinfo.Class = '` + teacherclass[i] + `' 
               `
                mysql(sqlclass, function (err, data) {
                    if (err) {

                        return res.status(500).json({
                            err_code: 500,
                            message: err.message
                        })
                    }
                    studentarry = studentarry.concat(data)



                    istrue = istrue + 1

                    //console.log(Taskinformation)
                    if (teacherclass.length === istrue) {
                        res.render('index.html', {
                            Userinformation: req.session.Userinformation,
                            Taskinformation: Taskinformation,
                            Studentinformation: studentarry

                        })
                    }



                })

            }






        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            err: err.message,
            message: ''
        })
    }

})



// /* 注册路由*/
//  router.get('/register', function (req, res) {
//     res.render('register.html')
// })

// //注册请求
// router.post('/register', async function (req, res) {
//     var register=req.body

// })

/*获取所有学生位置信息路由*/
// router.post('/location',function(req,res){
//     var sql=null
//     //获取位置信息
//     try{
//         sql=`
//         SELECT
//     location.Id,
//     location.UserId,
//     location.LastTime,
//     location.Location,
//     location.TaskId
//     FROM
//     location
//         `
//     mysql(sql,function(err,data){
//         if(err){
//             return res.status(500).send('Server error')
//         }
//         if(data){
//             var stulocat=new Array
//             var stulast=new Array
//             var stulocat=new Array

//         }
//     })
//     }
// })

/*获取地图*/
router.get('/Locationtask', function (req, res) {
    var sql = null
    var userid = req.session.Userinformation[0].UserId
    try {
        sql = `SELECT
        tasktable.TaskId,
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskContent,
        tasktable.Sponsor,
        tasktable.TaskState
    FROM
        tasktable
    WHERE
        tasktable.Sponsor="` + userid + `"
    `
        mysql(sql, function (err, data) {
            if (err) {

                return res.status(500).json({
                    err_code: 500,
                    message: err.message
                })
            }
            if (!data) {
                return res.status(200).json({
                    //提供错误码
                    err_code: 1,
                    message: 'nickname or password is invalid.'
                })
            } else {
                res.status(200).json({
                    err_code: 0,
                    message: 'OK'
                })
            }
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            err: err.message,
            message: ''
        })
    }
})



//导入数据学生数据到数据库Importexcel
/*获取所有学生位置信息路由*/
router.post('/SaveExcle', function (req, res) {
    //  配置文件操作
    var excelConfig = {
        excel_Dir: req.files[0].path,
        CityArray: ['Class', 'Name', 'UserId']
    }
    //  获取文件
    let obj = xlsx.parse(excelConfig.excel_Dir); // 支持的excel文件类有.xlsx .xls .xlsm .xltx .xltm .xlsb .xlam等
    //console.log(obj)
    let excelObj = obj[0].data; //取得第一个excel表的数据
    let insertData = []; //存放数据

    //循环遍历表每一行的数据
    for (var i = 1; i < excelObj.length; i++) {
        var rdata = excelObj[i];
        // console.log(rdata)

        var CityObj = new Object();
        // ["id" : "101010100","provinceZh" : "北京","leaderZh" : "北京","cityZh" : "北京","cityEn" : "beijing"]
        for (var j = 0; j < rdata.length; j++) {
            CityObj[excelConfig.CityArray[j]] = rdata[j]
        }
        insertData.push(CityObj)
        //console.log(CityObj)
    }
    //获取到要插入数据库的对象
    console.log(insertData)

    //插入数据库
    for (i = 0; i < insertData.length; i++) {
        UserId = insertData[i].UserId
        Name = insertData[i].Name
        Password = insertData[i].UserId
        Nickname = insertData[i].Name
        Class = insertData[i].Class
        AddData(UserId, Name, Password, Nickname, Class)
    }

    function AddData(UserId, Name, Password, Nickname, Class) {
        console.log(UserId, Name, Password, Nickname, Class)
        try {
            searchsql = `SELECT
            studentinfo.Name
            FROM
            studentinfo
            WHERE
            studentinfo.UserId = '` + UserId + `'`

            var updatesql = "UPDATE studentinfo SET UserId='" + UserId + "',Name='" + Name + "',Password='" + Password + "',  Nickname='" + Nickname + "',  Class='" + Class + "' WHERE UserId='" + UserId + "'"
            var insectsql = "INSERT INTO studentinfo (UserId,Name,Password,Nickname,Class) VALUES('" + UserId + "','" + Name + "','" + Password + "','" + Nickname + "','" + Class + "')"
            mysql(searchsql, function (err, data) {
                if (err) {

                    return res.status(500).json({
                        err_code: 500,
                        message: err.message
                    })
                }
                if (data[0] === undefined) {
                    // 插入
                    mysql(insectsql, function (err, data) {
                        if (err) {

                            return res.status(500).json({
                                err_code: 500,
                                message: err.message
                            })
                        }
                    })
                } else {
                    //更新
                    mysql(updatesql, function (err, data) {
                        if (err) {

                            return res.status(500).json({
                                err_code: 500,
                                message: err.message
                            })
                        }
                    })
                    // res.status(200).json({
                    //     err_code: 0,
                    //     message: 'OK'
                    // })
                }
            })
        } catch (err) {
            return res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }
    }

    return res.status(200).json({
        code: 0,
        error: 'success',
        message: ""
    })
})
module.exports = router
router.get('/map', function (req, res) {
    res.render('map.html', {
        Userinformation: req.session.Userinformation
    })
})


/* 任务路由 */
//展示任务
router.get('/task', function (req, res) {
    var sql = null
    var userid = req.session.Userinformation[0].UserId
    try {
        sql = `SELECT
        tasktable.TaskId,
        tasktable.FromTime,
        tasktable.EndTime,
        tasktable.TaskName,
        tasktable.Class,
        tasktable.Address,
        tasktable.TaskContent,
        tasktable.Sponsor,
        tasktable.TaskState
    FROM
        tasktable
    WHERE
        tasktable.Sponsor="` + userid + `"
    `
        mysql(sql, function (err, task) {
            if (err) {
                return res.status(500).send('Server error')
            }
            if (task) {
                console.log(task)
                res.render('task.html', {
                    Userinformation: req.session.Userinformation,
                    task: task
                })
            }
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            err: err.message,
            message: ''
        })
    }

})

// router.post('/task',function(req,res){
//     var sql=null
//     var userid= req.session.Userinformation[0].UserId
//     try{
//         sql=`SELECT
//         tasktable.TaskId,
//         tasktable.FromTime,
//         tasktable.EndTime,
//         tasktable.TaskName,
//         tasktable.Class,
//         tasktable.Address,
//         tasktable.TaskContent,
//         tasktable.Sponsor,
//         tasktable.TaskState
//     FROM
//         tasktable
//     WHERE
//         tasktable.Sponsor="`+userid+`"
//     `
//     mysql(sql,function(err,task){
//         if(err){
//             return res.status(500).send('Server error')
//         }
//         if (task) {
//             for (var i = 0; i < task.length; i++) {
//                 fromtime[i] = task[i].FromTime
//                 endtime[i] = task[i].EndTime
//                 taskname[i] = task[i].TaskName
//                 grade[i] = task[i].Class
//                 taskstate[i] = task[i].TaskState
//                 sponsor[i]=task[i].Sponsor
//                 taskcontent[i]=task[i].TaskContent
//                 taskid[i]=task[i].TaskId
//             }
//             return res.status(200).json({
//                 taskname : taskname,
//                 fromtime : fromtime,
//                 endtime : endtime,
//                 grade : grade,
//                 taskstate : taskstate,
//                 sponsor:sponsor,
//                 taskcontent:taskcontent,
//                 taskid:taskid
//             })
//         }
//     })
//     }
//     catch(err){
//         res.status(500).json({
//             code:2,
//             err: err.message,
//             message: ''
//         })
//     }
// })

//发布新任务
router.get('/newtask', function (req, res) {
    var sql = null
    var userid = req.session.Userinformation[0].UserId
    try {
        sql = `SELECT
        studentinfo.Class
    FROM
        studentinfo
    WHERE
        studentinfo.UserId="` + userid + `"
    `
        mysql(sql, function (err, newtask) {
            newtask = newtask[0].Class.split(',')
            if (err) {
                return res.status(500).send('Server error')
            }
            if (newtask) {
                res.render('newtask.html', {
                    Userinformation: req.session.Userinformation,
                    newtask: newtask
                })
            }
        })
    } catch (err) {
        res.status(500).json({
            code: 2,
            err: err.message,
            message: ''
        })
    }
})
router.post('/newtask', function (req, res) {
    var sql = null
    var sponsor = req.session.Userinformation[0].UserId
    var taskstate = 0
    var taskname = req.body.taskname
    var grade = req.body.class
    var fromtime = req.body.fromtime
    var endtime = req.body.endtime
    var address = req.body.address
    var taskcontent = req.body.taskcontent

    try {
        sql = `INSERT INTO
        tasktable 
        (TaskState,Sponsor,TaskContent,Address,Class,TaskName,EndTime,FromTime,TaskId)
        VALUES
        ("` + taskstate + `","` + sponsor + `","` + taskcontent + `","` + address + `","` + grade + `","` + taskname + `","` + endtime + `","` + fromtime + `",0)
        `
        mysql(sql, function (err) {
            if (err) {
                return res.status(200).json({
                    err_code: 1,
                    message: ''
                })
            } else {
                res.status(200).json({
                    err_code: 0,
                    message: 'OK'
                })
            }
        })

    } catch (err) {
        res.status(500).json({
            err_code: 500,
            message: err.message
        })
    }
})
//修改任务
router.get('/edittask', function (req, res) {
    res.render('edittask.html', {
        Userinformation: req.session.Userinformation
    })
})
//删除任务
router.get('/deletetask', function (req, res) {
        var sql = null
        var taskid = req.query.Taskid
        try {
            sql = `
        DELETE
        FROM
        tasktable
        WHERE
        tasktable.TaskId="` + taskid + `"
        `
            mysql(sql, function (err) {
                if (err) {
                    return res.status(500).send('Server error')
                }
                res.redirect('/task')
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }
    })


    /**
     * 任务测试路由
     *  */
    /
    //测试主页面
    router.get('/test', function (req, res) {
        var testid = req.query.Testid
        var sql = null
        try {
            sql = `SELECT
        testtable.Testid,
        testtable.TestName,
        testtable.TaskId,
        testtable.Content,
        testtable.TotalGrade,
        testtable.Deadtime
        FROM
        testtable
        WHERE
        testtable.TaskId="` + testid + `"
        `
            mysql(sql, function (err, test) {
                if (err) {
                    return res.status(500).send('Server error')
                }
                if (test) {
                    res.render('test.html', {
                        Userinformation: req.session.Userinformation,
                        test: test
                    })
                }
            })
        } catch (err) {
            res.status(500).json({
                code: 2,
                err: err.message,
                message: ''
            })
        }
    })
//发布新测试
router.get('/newtest', function (req, res) {
    res.render('newtest.html', {
        Userinformation: req.session.Userinformation
    })
})
router.post('/newtest', function (req, res) {

})


//修改测试
router.get('/edittest', function (req, res) {
    res.render('edittest.html', {
        Userinformation: req.session.Userinformation
    })
})
//删除测试
router.get('/deletetest', function (req, res) {
    res.render('deletetest.html', {
        Userinformation: req.session.Userinformation
    })
})

//分数统计
router.get('/searchgrade', function (req, res) {

    
    return res.status(200).json({
        mydatatem: mydatatem,
        mydatahum: mydatahum,
        mydatetime: mydatetime
    })
})
/**
 * 学生
 */

module.exports = router