import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';

// export const signup = async (req, res) => {
//     const { email, name, password } = req.body;

//     try {
//         if (!email || !name || !password) {
//             return res.status(400).json({ message: 'All fields are required' });
//         }

//         if (password.length < 6) {
//             return res.status(400).json({ message: 'Password must be at least 6 characters long' });
//         }

//         const user = await User.findOne({ email });
//         if (user) return res.status(400).json({ message: 'User already exists' });

//         // hash password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const newUser = new User({
//             email,
//             name,
//             password: hashedPassword
//         });

//         if (newUser) {
//             // generate jwt token
//             generateToken(newUser._id, res);
//             await newUser.save();
//             return res.status(201).json({
//                 _id: newUser._id,
//                 email: newUser.email,
//                 name: newUser.fullName,
//             });
//         }
//         else {
//             return res.status(400).json({ message: 'Failed to create new user' });
//         }

//     } catch (error) {
//         return res.status(500).json({ message: 'Something went wrong, please try again' });
//     }
// };






export const signup = async (req, res) => {
    const { email, name, password } = req.body;

    try {
        if (!email || !name || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            name,
            password: hashedPassword,
        });

        // Save first (so _id is definitely stored)
        await newUser.save();

        // generate jwt token (may set cookie)
        const token = generateToken(newUser._id, res);

        // Return sanitized user
        return res.status(201).json({
            _id: newUser._id,
            email: newUser.email,
            name: newUser.name, // correct field
            avatar: newUser.avatar || null,
            token: token
        });
    } catch (error) {
        console.error("Signup error:", error); // show stack/message in server logs
        return res.status(500).json({ message: "Something went wrong, please try again" });
    }
};


// export const login = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const user = await User.findOne({ email });
//         if (!user) return res.status(400).json({ message: 'Invalid credentials' });

//         const isPasswordMatch = await bcrypt.compare(password, user.password);

//         if (!isPasswordMatch) return res.status(400).json({ message: 'Invalid credentials' });

//         // generate jwt token
//         generateToken(user._id, res);

//         return res.status(200).json({
//             _id: user._id,
//             email: user.email,
//             fullName: user.fullName,
//             avatar: user.avatar
//         });

//     } catch (error) {
//         console.log("Error in login controller", error.message);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// };








export const login = async (req, res) => {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // If your User schema uses `password: { select: false }`, you MUST select it explicitly:
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            // avoid leaking which field failed
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Defensive: log types/values when debugging (remove or tone down in prod)
        if (process.env.NODE_ENV !== "production") {
            console.log("login: checking user:", { id: user._id, email: user.email });
            console.log("login: password types:", typeof password, typeof user.password);
        }

        // bcrypt.compare expects (plaintext, hashed)
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Optional: ensure generateToken has required env vars (if it uses JWT_SECRET)
        if (typeof process.env.JWT_SECRET === "undefined" && process.env.NODE_ENV === "production") {
            console.error("Missing JWT_SECRET env variable");
            return res.status(500).json({ message: "Server configuration error" });
        }

        // generateToken may set a cookie or return a token—keep your implementation
        const token = generateToken(user._id, res);

        // Remove password before returning user object
        user.password = undefined;

        return res.status(200).json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            token: token
        });
    } catch (error) {
        console.error("Error in login controller", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const logout = async (req, res) => {
    try {
        res.clearCookie('jwt');
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { picture } = req.body;
        const userId = req.user._id

        console.log("Updating profile for userId:", userId);

        if (!picture) return res.status(400).json({ message: 'Profile picture is required' });

        const uploadResponse = await cloudinary.uploader.upload(picture);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { picture: uploadResponse.secure_url },
            { new: true }
        ).select('-password');

        if (!picture) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(picture);
    } catch (error) {
        console.log("Error in updateProfile controller", error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }

}

export const checkAuth = (req, res) => {
    try {
        return res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
}