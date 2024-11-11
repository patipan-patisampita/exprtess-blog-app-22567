import express from 'express'
import conectMongoDB from './config/db.js'
import authRoute from './routes/authRoute.js'
import postRoute from './routes/postRoute.js'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import flash from 'connect-flash';
import path from 'path'

import ConnectMongoDBSession from 'connect-mongodb-session'
const MongoDBStore = ConnectMongoDBSession(session)

const app = express()
const port = process.env.PORT || 8080

//Connected to MongoDB database
conectMongoDB()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// make uploads directory as static
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

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
    store: new MongoDBStore({
        uri: process.env.MONGO_DB_URI,
        collection: 'sessions'
    })
}))

// flash messages middleware
app.use(flash());

// store flash message for views
app.use(function (req, res, next) {
    res.locals.message = req.flash();
    next()
})

// store authenticated user's session data for views
app.use(function (req, res, next) {
    res.locals.user = req.session.user || null;
    next();
});

//set view engine and view template
app.set('view engine', 'ejs')

// auth router
app.use('/', authRoute)

// post router
app.use('/', postRoute)

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})