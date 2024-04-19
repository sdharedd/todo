const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session')


//get schemas
const User = require('./schemas/newUser');
const todo = require('./schemas/oldUser');


const app = express();
const port = 5500;


//DB connection
const {mongoURI , options} = require('./api/key')
mongoose.connect(mongoURI, options).then(() => console.log("success")).catch(err => console.log("failure", err))


app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(session({
    secret  : 'mywish',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/screens');


// this will connect registration page 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/screens/registration.html');
});

// connectinng login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/screens/login.html');
})

//routes

//registration route
app.post('/register', async(req, res) => {
    try 
    {
        const {
            username,
            email,
            password, 
            confirmPassword
              } = req.body;

        const user = await User.findOne({email});
        if (user) 
        {
            res.send(`
                <script>
                    alert('The mentioned email id has already been registered, Please Login');
                    window.location.href = '/login';
                </script>
                    `);
        }
        
        if(password !== confirmPassword)
        {
            return res.status(400).send("password don't match"); res.send(`
            <script>
                alert('password don't match, Please try again');
                window.location.href = '';
            </script>
                `);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password : hashedPassword
        });

        await newUser.save();
        res.send(`
            <script>
                alert('User Succesfully registered');
                window.location.href = '/login';
            </script>
            `);

    }   
    catch (e) 
    {
        console.log(e);
        res.status(500).send('server error');
    }
});


// login route
app.post('/login', async(req, res) => {
    try {
        const {email, password } = req.body;
        const user = await User.findOne({email});

        if (!user) {
            res.send(`
                <script>
                    alert('The mentioned email id has not been registered, Please register first');
                    window.location.href = '';
                </script>
                    `);
        }

        const validPass = await bcrypt.compareSync(password , user.password);

        if (!validPass) {
            res.send(`
            <script>
                alert('Password was incorrect, Please check again ');
                window.location.href = '/login';
            </script>
        `);
        }

        //req.session.loggedIn = true;
        req.session.user = {email};
        res.redirect('/dashboard');
    } catch (error) {
        // console.log("something went wrong, Please try again", error);
        res.status(500).send('server error');
    }
})

//connect and send data to dashboard
app.get('/dashboard', async(req, res) => {
   res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
   if (!req.session.user) 
    {
    return res.redirect('/login');
    }
    else
    {
        const email = req.session.user.email;
        const todolists = await todo.find({email : req.session.user.email});  
        res.render('dashboard', {
            username : req.session.user.email,
            taskName : todolists
        });
    }
});

//save todo list
app.post('/save', async(req, res) => {
    try {
        const {
            title
        } = req.body;
        const email = req.session.user.email;
        const newTask = new todo({
            email,
            title,
        })
        await newTask.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.status(500).send('server error');
    }
})

//update the task 
app.post('/update/:id', async(req, res) => {
    const taskId = req.params.id;
    
    const  updatedText   = req.body.title;
    console.log(updatedText);
    console.log(req.body);

    console.log("/n" ,taskId)
    try {

        const task = await todo.findOne({ _id: taskId, email : req.session.user.email });
        console.log(task, " dorikindi")
        task.title = updatedText;
        await task.save();
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
        
    } 
});


// Delete Todo
app.post('/update/:id/delete', async (req, res) => {
    const taskId = req.params.id;
    try {
      // Delete the todo by ID and email to ensure it belongs to the current user
      await todo.findOneAndDelete({ _id: taskId, email: req.session.user.email });
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });

//logout route 
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Error logging out');
            return;
        }
        res.redirect('/login');
    });
});


app.listen(port, () => {
    console.log('server ')
})
