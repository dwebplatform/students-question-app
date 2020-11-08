const express = require('express');
const bcrypt = require('bcryptjs');
const saltNumber = 10;
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const randomstring = require("randomstring");

const cookieParser = require('cookie-parser')
const questions = [
    {
        id: 1,
        title:'В каком году был основан памятник Петру 1',
        variants:[{text:'1995',isCorrect: true},{text:'1986',isCorrect: false},{text:'1255',isCorrect: false},{text:'1307',isCorrect: false}]
    },
    {
        id: 2,
        title:'Кто открыл Америку',
        variants:[{text:'Колумб',isCorrect: true},{text:'Джордж Вашингтон',isCorrect: false},{text:'Николас Кейдж',isCorrect: false},{text:'Линкольн',isCorrect: false}]
    }
];
const globalQuestions = questions;


const Student  = require('./models/Student');
const Admin = require('./models/Admin');
const Question = require('./models/Question');

 
const app = express();
app.use(cookieParser());
app.use(express.json())

const expressLayouts = require('express-ejs-layouts');

dotenv.config();

connectDB();



app.get('/generate_questions',async(req,res)=>{
    const locquestions = [{
        title:'Что такое акватинта?',
        variants:[
            {text:'Освежительный напиток', isCorrect:false},
            {text:'Чернила', isCorrect:false},
            {text:'Метод гравирования', isCorrect: true},
            {text:'Вид акварели', isCorrect:false}
        ]
    },
    {
        title:'Столицей какого образования является город Йошкар-Ола?',
        variants:[
            {text:'Область', isCorrect:false},
            {text:'Край', isCorrect:false},
            {text:'Республика', isCorrect: true},
            {text:'Округ', isCorrect:false}
        ]
    },
    {
        title:'Кто сказал: "Какой русский не любит быстрой езды"?',
        variants:[
            {text:'Гоголь', isCorrect:false},
            {text:'Чехов', isCorrect:false},
            {text:'Толстой', isCorrect: true},
            {text:'Мцыри', isCorrect:false}
        ]
    },
    {
        title:'Что такое акватинта?',
        variants:[
            {text:'Освежительный напиток', isCorrect:false},
            {text:'Чернила', isCorrect:false},
            {text:'Метод гравирования', isCorrect: true},
            {text:'Вид акварели', isCorrect:false}
        ]
    },
    {
        title:'Что такое акватинта?',
        variants:[
            {text:'Освежительный напиток', isCorrect:false},
            {text:'Чернила', isCorrect:false},
            {text:'Метод гравирования', isCorrect: true},
            {text:'Вид акварели', isCorrect:false}
        ]
    }
    ];
    // locquestions.forEach(async (q)=>{
    //     let newQ = new  Question({
    //         title:q.title,
    //         variants: q.variants
    //     });
    //     await newQ.save();
        
    // })
    return res.json({
        status:'ok',
        msg:'created'
    });
    });
app.set("view engine", "ejs");
app.use(expressLayouts);

 
app.use('/',(req,res,next)=>{
    if(req.query.admin_key==='1234'){
        req.isAdmin = true;
    }
    next();
});

app.get('/questions',async (req,res)=>{
    if(req.cookies.userId){
        const {userId} = JSON.parse(req.cookies.userId);
        try{
            let student = await Student.find({_id: userId});
            if(student){
                // выводим список вопросов
                let allTenQuestions = await Question.find({});
              return  res.render('questions',{
                    questions:allTenQuestions,
                    userId: userId||0,
                    isAdmin:  req.isAdmin||false
                }); 
            }
        }catch(e){
            console.log(e);
        }
        return res.json({status:'error'});     
            
    } else {
        return res.redirect('/login');
    }
   
});


app.get('/login',(req,res)=>{
    const {name,secondname, group} = req.query;
    res.render('login',{
       name,
       secondname,
       group,
       isAdmin: req.isAdmin ||false,
       admin_key:req.query.admin_key||null
    });
});



app.post('/send-result',async(req,res)=>{
    if(!req.body.userId){
        return res.json({
            status:'error',
            msg:'no id was provided'
        });
    }
     
    let student = await Student.findOne({_id:req.body.userId}).exec();
    
    if(student){
        let questions =req.body.questions;
         
        let questionArrResult = [];
        for(let questionId in questions){
           let curQusetion = await Question.findOne({_id:questionId}).exec();
           let variants = curQusetion.variants;
           let correctAnswerIndex = variants.find((v)=>v.isCorrect)._id;
           if(curQusetion){// все ОК 
            questionArrResult.push({
                id:curQusetion._id,
                correctIndex: correctAnswerIndex,
                answerIndex:questions[questionId].answerIndex
            });
           }
        }
          try{
            let updatedStudent = await Student.updateOne({ _id: req.body.userId }, {
                answers: questionArrResult
              });
            return res.json(updatedStudent)
        }catch(e){
                console.log(e);
        }
     }
})

app.post('/login',async (req,res)=>{
    let student = new Student({
        name:req.body.name||"",
        secondname:req.body.secondname||"",
        group:req.body.group||"",
        password:req.body.password||""
    });
    try{
        let savedStudent = await student.save();
        if(savedStudent){
            res.cookie('userId', JSON.stringify({userId: savedStudent._id}));
            return res.json({
                status:'ok',
                msg:'successfully saved'
            });
        }
         
    }catch(e){
        return res.json({status:'error',msg:'не удалось создать нового студента'});
    }
    
     
});


app.use('/admin/*',async (req,res,next)=>{
   
    if(req.cookies.admincookie){
        let admin = await Admin.findOne({
            cookiestring:req.cookies.admincookie
        }).exec();
        if(admin){
           next();
        }
    } else{
        return res.redirect('/admin');
    } 
     
})

app.get('/admin_create', (req,res)=>{
    bcrypt.hash('Linkinpark', 10,async function(err, hash) {
        // Store hash in your password DB.
        let newAdmin = new Admin({email:'example@mail.ru',
    password:hash});
    let savedAdmin = await newAdmin.save();
    return res.json({
            status:'ok'
    });
});
})

app.post('/admin',async(req,res)=>{
    // находим админа проверяем пароль если верно все, то сохраняем
    let {password, email} = req.body;
    let admin = await Admin.findOne({email: email}).exec();
    if(admin){// найден
        bcrypt.compare(password, admin.password,async function(err,result){
            if(result){
                let randomVal = randomstring.generate(10);
                let updatedAdmin = await Admin.updateOne({email:admin.email},{
                    cookiestring:randomVal
                });
                if(updatedAdmin){
                    res.cookie('admincookie',randomVal);
                    return res.json({
                        status:'ok',
                        str:randomVal
                    });
                }
            }
        })
    } else {
        return res.json({
            status:'error',
            msg:'Admin not found'
        });
    }
});
app.get('/admin', async (req,res)=>{
  
    return res.render('admin_login',{
        email: req.query.email||'',
        password:req.query.password||'',
        isAdmin: req.isAdmin||false,
        admin_key:req.query.admin_key||null
    });
});

app.get('/admin/logout',(req,res)=>{
    res.clearCookie('admincookie').redirect('/admin');
})
app.get('/admin/questions',async(req,res)=>{
    let allQuestions = await Question.find({});
    return res.render('admin_questions',{
        questions: allQuestions||[],
        isAdmin: req.isAdmin||false,
        admin_key:req.query.admin_key||null
    });
});


app.post('/admin/questions/create',async (req,res)=>{

    // createQuestion
    let {title,first_answer, second_answer,third_answer,fourth_answer} = req.body;
    if(!title||!first_answer||!second_answer||!third_answer||!fourth_answer){
        return res.json({
            status:'error',
            msg:'не были переданы все поля'
        })
    }
    const keyOfVariants =['first_answer_is_correct','second_answer_is_correct','third_answer_is_correct','fourth_answer_is_correct'];
    const variants =[{
        text: first_answer,
        isCorrect:false,
    },
    {
        text: second_answer,
        isCorrect:false,
    },
    {
        text:third_answer,
        isCorrect: false
    },
    {
        text: fourth_answer,
        isCorrect: false
    },
];
    let hasChecked = false;
    for(value of keyOfVariants ){
         if(value in req.body){
             let index = keyOfVariants.findIndex(v=>v===value);
             variants[index].isCorrect = true;
             hasChecked = true;
         }
    }
    if(!hasChecked){
        return res.json({
            status:'error',
            msg:'Не было передано варианта ответа'
        })
    }
    let newQuestion = new Question({
        title:title,
        variants: variants
    });
    try{
        let savedQuestion = await newQuestion.save();

        return res.json({
            status:'ok',
            msg:'Создан новый вопрос'
        });
    } catch(e){
        return res.json({
            status:'error',
            msg:' не удалось создать новый вопрос'
        })
    }
 })
app.get('/admin/questions/create',(req,res)=>{
    // отрисовываем форму создания title варианты isCorrect или нет
     
    return res.render('create_question',{
        isAdmin:req.isAdmin||false,
        admin_key:req.query.admin_key||null
    }); 
})

app.put('/admin/question/:id',async(req,res)=>{
    
    let updatedQuestion = await Question.findOne({_id: req.params.id}).exec();
    if(updatedQuestion){
        updatedQuestion.title = req.body.title;
        updatedQuestion.variants = req.body.variants;
        try{
            let savedQuestion = await updatedQuestion.save();
            return res.json({
                status:'ok',
                msg:'Успешно обновлен вопрос'
            });
        } catch(e){
            return res.json({
                status:'error',
                msg:'Не удалось обновить вопрос'
            });
        }
    } else {
        return res.json({
            status:'error',
            msg:'Не удалось найти такой вопрос'
        });
    }
});

app.delete('/admin/questions/:id',async(req,res)=>{
    let deleted = await Question.deleteOne({_id:req.params.id});
    if(deleted){
        return res.json({
            status:'ok',
            msg:'Успешно удален вопрос'
        });
    } else {
        return res.json({
            status:'error',
            msg:'не удалось найти такого вопроса'
        })
    }
});
app.get('/admin/questions/:id',async(req,res)=>{
    let id = req.params.id;

    let question = await Question.findOne({_id:id}).exec();
    if(!question){
        return res.json({
            status:'error',
            msg:'enable to found a detail question with that id'
        });
    }
     return res.render('admin_questions_detail',{
        question: question,
        isAdmin: req.isAdmin||false,
        admin_key:req.query.admin_key||null
    });
});

app.get('/admin/students',async (req,res)=>{
    let allStudents = await Student.find({});
    // check auth
   return res.render('students',{
       email:req.query.email,
       password: req.query.password,
       isAdmin: req.isAdmin||false,
       students:allStudents||[],
       admin_key:req.query.admin_key||null
   });
   
});

 
app.listen(5000,()=>{
    console.log(`Listening on port 5000`);
});



