import express from 'express'
import User from '../models/userModel.js'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import { guestRoute, protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router()

// Looking to send emails in production? Check out our Email API/SMTP product!
const transport = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "patipan.patisampita@gmail.com",
        pass: "pllx srrs fanw lfjb",
    },
})

// const transport = nodemailer.createTransport({
//     host: "sandbox.smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//         user: "36e8f252bf8cae",
//         pass: "9247ed22b8f177"
//     }
// })

//Route for Login page
router.get('/login', guestRoute, (req, res) => {
    res.render('login', { title: 'Login Page', active: 'login' })
})

//Route for Register page
router.get('/register', guestRoute, (req, res) => {
    res.render('register', { title: 'Register Page', active: 'register' })
})

//Route for Forgot password page
router.get('/forgot-password', guestRoute, (req, res) => {
    res.render('forgot-password', { title: 'Forgot-password Page', active: 'forgot' })
})

//Route for Reset password page
router.get('/reset-password/:token', guestRoute, async (req, res) => {
    const { token } = req.params
    const user = await User.findOne({ token })

    if (!user) {
        req.flash('error', 'Link expired or invalid!')
        res.redirect('/forgot-password')
    }

    return res.render('reset-password', { title: 'Reset Password Page', active: 'reset', token })
})

// route for profile page
router.get('/profile', protectedRoute, (req, res) => {
    res.render('profile', { title: 'Profile Page', active: 'profile' })
})

//Route: Handle user Register Page
router.post('/register', guestRoute, async (req, res) => {
    const { name, email, password } = req.body
    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            req.flash('error', 'User already exists with this email!');
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword
        })

        user.save()
        req.flash('success', 'User registered successfully, you can login now!');
        res.redirect('/login');

    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong, try again!');
        res.redirect('/register');
    }
})

// handle user login request
router.post('/login', guestRoute, async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await User.findOne({ email })

        if (user && (await bcrypt.compare(password, user.password))) {
            req.session.user = user
            res.redirect('/profile')
        } else {
            req.flash('error', 'Invalid email or password!')
            res.redirect('/login')
        }

    } catch (error) {
        console.error(error)
        req.flash('error', 'Something went wrong, try again!');
        res.redirect('/login')
    }
})

// handle user logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
})

//handle forgot password post request
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body
    try {
        const user = await User.findOne({ email })

        if (!user) {
            req.flash('error', 'User not found with this email!')
            return res.redirect('/forgot-password')
        }
        const token = Math.random().toString(36).slice(2)

        user.token = token
        await user.save()

        const info = await transport.sendMail({
            from: '"DevChuchart" <patipan.patisampita@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Password Reset", // Subject line
            text: "Reset your password!", // plain text body
            html: `<p>Click this link to reset your password:<a href='http://localhost:3000/reset-password/${token}'>Reset Password</a><br>Thank you!</p>`, // html body
        })

        if (info.messageId) {
            req.flash('success', 'Password reset link has been sent to your email!')
            res.redirect('/forgot-password')
        } else {
            req.flash('error', 'Error sending email!')
            res.redirect('/forgot-password')
        }

    } catch (error) {
        console.error(error)
        req.flash('error', 'Something went wrong, try again!');
        res.redirect('/forgot-password')
    }
})

//handle reset password post request
router.post('/reset-password', async (req, res) => {
    // console.log(req.body)
    const { token, new_password, confirm_new_password } = req.body

    try {
        const user = await User.findOne({ token })

        if (new_password !== confirm_new_password) {
            req.flash('error', 'Password do not match!')
            return res.redirect(`/reset-password/${token}`)
        }

        if (!user) {
            req.flash('error', 'Invalid token!')
            return res.redirect('/forgot-password')
        }

        user.password = await bcrypt.hash(new_password, 10)
        user.token = null
        await user.save()

        req.flash('success', 'Password reset successfully!');
        return res.redirect('/login')

    } catch (error) {
        console.error(error)
        req.flash('error', 'Something went wrong, try again!');
        return res.redirect('/reset-password')
    }
})

export default router