const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

dotenv.config();
const app = express();

app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Signup Route
app.post('/api/signup', async (req, res) => {
    const { email, username, phoneNumber, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const newUser = new User({ email, username, phoneNumber, password, role });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({ token, role: user.role });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
