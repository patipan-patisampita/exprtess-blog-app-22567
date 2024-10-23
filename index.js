import express from 'express'
import conectMongoDB from './config/db.js'
import authRoute from './routes/authRoute.js'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import flash from 'connect-flash';

const app = express()
const port = process.env.PORT || 8080

//Connected to MongoDB database
conectMongoDB()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Cookie middleware
app.use(cookieParser(process.env.COOKIE_SECRET))

// session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60000 * 60 * 24 * 7 // 1 week
    },
}))

// flash messages middleware
app.use(flash());

// store flash message for views
app.use(function (req, res, next) {
    res.locals.message = req.flash();
    next()
})

//set view engine and view template
app.set('view engine', 'ejs')

//Home Page
app.get('/', (req, res) => {
    // res.json({ message: 'Hello from nodejs & Ecpress!' })
    res.render('index', { title: 'Home Page' })
})

//Router
app.use('/', authRoute)

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})