// import jwt from 'jsonwebtoken';
// import User from '../models/user.model.js';


// export const protectRoute = async (req, res, next) => {
//     try {
//         const token = req.cookies.jwt;
//         if(!token) return res.status(401).json({message: 'Unauthorized - No token Provided'});

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         if(!decoded) return res.status(401).json({message: 'Unauthorized - Invalid token'});

//         const user = await User.findById(decoded.userId).select('-password');
//         if(!user) return res.status(404).json({message: 'User not found'});

//         req.user = user;
//         next();

//     } catch (error) {
//         console.log("Error in protectRoute middleware", error.message);

//         return res.status(500).json({message: 'Internal server error'});
//     }
// }







// // middlewares/auth.middleware.js
// import jwt from "jsonwebtoken";
// import User from '../models/user.model.js';
// export const protectRoute = async (req, res, next) => {
//     try {
//         let token;

//         // Get token from Authorization header or cookie
//         if (req.headers.authorization?.startsWith("Bearer")) {
//             token = req.headers.authorization.split(" ")[1];
//         } else if (req.cookies?.token) {
//             token = req.cookies.token;
//         }

//         if (!token) return res.status(401).json({ message: "No token provided" });

//         // Decode token using the same JWT_SECRET as login server
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         // Fetch user from shared user DB (login server DB)
//         const user = await User.findById(decoded.id).select("-password -__v");
//         if (!user) return res.status(401).json({ message: "User not found" });

//         req.user = user;
//         next();
//     } catch (err) {
//         console.log("Error in protectRoute middleware:", err.message);
//         res.status(401).json({ message: "Invalid token" });
//     }
// };








// middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header or cookie
        if (req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Decode token using the same JWT_SECRET as login server
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from shared user DB using the correct key from token
        const user = await User.findById(decoded.userId).select("-password -__v");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (err) {
        console.log("Error in protectRoute middleware:", err.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};
