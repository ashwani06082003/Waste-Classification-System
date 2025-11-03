const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { spawn } = require("child_process");
const nodemailer = require("nodemailer");
const otpStorage = {}; // Store OTPs temporarily

// // Create the Express app
const app = express();
const session = require('express-session');
// Middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500', // 👈 must match frontend origin exactly
    credentials: true               // 👈 allow cookies/credentials
  }));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(session({
    secret: 'waste123321', // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
}));

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// Database configuration
const dbConfig = {
    server: 'DESKTOP-M8TKIS1\\SQLEXPRESS',
    database: 'WebAppDB',
    user: 'WebAppUser',
    password: 'Ashwani123',
    options: {
        encrypt: true, // Mandatory when using Trust Server Certificate
        trustServerCertificate: true, // Required for self-signed certificates
    },
    
};


// Connect to the database
sql.connect(dbConfig)
    .then(() => {
        console.log("Connected to SQL Server");
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
    });

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(__dirname, 'images');  // Absolute path
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));  // Unique filename
        }
    });
    
    const upload = multer({ storage: storage }); 


    const profileStorage = multer.diskStorage({
        destination: function (req, file, cb) {
          const uploadPath = path.join(__dirname, 'public', 'uploads');
          cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
          cb(null, Date.now() + path.extname(file.originalname));
        }
      });
      const profileUpload = multer({ storage: profileStorage });
      


// 🔹 Configure Nodemailer (Use App Password, NOT Gmail password)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "bhanuking0786@gmail.com",  // Replace with your actual Gmail ID
        pass: "rpgmyvzlvhchcpec",  // Remove spaces from the App Password
    },
});



// 🔹 Send OTP Route
app.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required!" });
    }

    try {
        // Check if the email exists in the Users table
        const pool = await sql.connect(dbConfig);
        const userResult = await pool.request()
            .input("email", sql.NVarChar, email)
            .query("SELECT * FROM Users WHERE Email = @email");

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ success: false, message: "Email not registered!" });
        }
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStorage[email] = otp;

        const mailOptions = {
            from: "your-email@gmail.com",
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP for password reset is: ${otp}. This OTP is valid for 5 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ success: false, message: "Failed to send OTP." });
            }
            res.json({ success: true, message: "OTP sent successfully!", otp });
        });
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// Login route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool
            .request()
            .input("Username", sql.NVarChar, username)
            .input("Password", sql.NVarChar, password)
            .query("SELECT * FROM Users WHERE Username COLLATE SQL_Latin1_General_CP1_CS_AS = @Username AND [Password] = @Password");

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            req.session.userId = user.ID;
            // Instead of redirecting on the server, send a JSON response with the redirect URL
            res.json({ success: true, redirectUrl: "/home" });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error logging in!" });
    }
});


//admin route
app.post("/admin", async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool
            .request()
            .input("Username", sql.NVarChar, username)
            .input("Password", sql.NVarChar, password)
           .query("SELECT * FROM Admin WHERE Name COLLATE SQL_Latin1_General_CP1_CS_AS = @Username AND [Password] = @Password");


        if (result.recordset.length > 0) {
            res.status(200).send("Login successful!");
        } else {
            res.status(401).send("Invalid credentials!");
        }
    } catch (error) {
        res.status(500).send("Error logging in!");
        console.error(error);
    }
});


// Dashboard data endpoint
app.get('/dashboard-data', async (req, res) => {
    try {
      let pool = await sql.connect(dbConfig); // Use dbConfig here
      let totalUsersResult = await pool.request().query(`
        SELECT COUNT(*) AS totalUsers FROM Users
      `);
      let newUsersResult = await pool.request().query(`
        SELECT COUNT(*) AS newUsers FROM Users
        WHERE CAST(signupDate AS DATE) = CAST(GETDATE() AS DATE)
      `);
      let premiumUsersResult = await pool.request().query(`
        SELECT COUNT(*) AS premiumUsers FROM Users
        WHERE Premium IN ('Yes', 'yes')
      `);
  
      res.json({
        totalUsers: totalUsersResult.recordset[0].totalUsers,
        newUsers: newUsersResult.recordset[0].newUsers,
        premiumUsers: premiumUsersResult.recordset[0].premiumUsers
      });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
    }
  });

// Sign-up route
const generateRandomId = async (pool) => {
    while (true) {
        const randomId = Math.floor(100 + Math.random() * 900); // Generate a random 3-digit number
        const checkResult = await pool
            .request()
            .input("ID", sql.Int, randomId)
            .query("SELECT COUNT(*) AS count FROM Users WHERE ID = @ID");

        if (checkResult.recordset[0].count === 0) {
            return randomId; // Return if ID is unique
        }
    }
};


app.post("/signup", async (req, res) => {
    const { username, password, mobile, email } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Generate a unique random ID
        const id = await generateRandomId(pool);

        const result = await pool
            .request()
            .input("ID", sql.Int, id)
            .input("Username", sql.NVarChar, username)
            .input("Password", sql.NVarChar, password)
            .input("Mobile", sql.NVarChar, mobile)
            .input("Email", sql.NVarChar, email)
            .query(
                "INSERT INTO Users (ID, Username, Password, Mobile, signupDate, Email) VALUES (@ID, @Username, @Password, @Mobile, GETDATE(), @Email);"
            );

        res.status(201).send("User created successfully!");
    } catch (error) {
        res.status(500).send("Error signing up!");
        console.error(error);
    }
});


// Update password route and reset password
app.post("/reset-password", async (req, res) => {
    const { registeredNumber, newPassword } = req.body;
    try {
        const pool = await sql.connect(dbConfig);

        // Update password for the provided username
        const result = await pool
            .request()
            .input("Email", sql.NVarChar, registeredNumber)
            .input("Password", sql.NVarChar, newPassword) // Ensure password is hashed and stored securely
            .query("UPDATE Users SET Password = @Password WHERE Email = @Email");

        if (result.rowsAffected[0] > 0) {
            res.status(200).send("Password updated successfully!");
        } else {
            res.status(404).send("User not found!");
        }
    } catch (error) {
        res.status(500).send("Error updating password!");
        console.error(error);
    }
});
// ... other requires

let wasteInfo = {}; // Store waste information

// Load waste_info.json on server start
fs.readFile("waste_info.json", "utf8", (err, data) => {
    if (err) {
        console.error("Error loading waste_info.json:", err);
    } else {
        wasteInfo = JSON.parse(data);
    }
});

// Route to handle image upload
app.post("/upload", upload.single("image"), async (req, res) => {
    console.log("Received upload request");
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    console.log(`Image uploaded: ${req.file.filename}`);

    const pyProcess = spawn("python", ["main.py", req.file.path]);

    let stdoutData = "";
    let stderrData = "";

    pyProcess.stdout.on("data", (data) => {
        stdoutData += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
        stderrData += data.toString();
    });

    pyProcess.on("close", async (code) => {
        if (code !== 0) {
            console.error(`Python process exited with code ${code}. Stderr: ${stderrData}`);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }

        console.log(`Python script output:\n${stdoutData}`);

        // Filter out empty lines, warnings, etc.
        const lines = stdoutData
            .split("\n")
            .map(line => line.trim())
            .filter(line => line && !line.startsWith("WARNING:"));

        // Find the line that starts with "Predicted Class:"
        let predictedLine = lines.find(line => line.toLowerCase().startsWith("predicted class:"));
        if (!predictedLine) {
            console.error("No line starting with 'Predicted Class:' found.");
            return res.status(500).json({ success: false, message: "Prediction parsing error" });
        }

        console.log("Predicted line (raw):", predictedLine);

        // Remove the "Predicted Class:" prefix
        const lineWithoutPrefix = predictedLine.replace(/Predicted\s*Class:\s*/i, "");
        // Example: "5 Non Recyclable, Confidence: 0.96"

        // Split on "Confidence:"
        const [classPart, confidencePart] = lineWithoutPrefix.split("Confidence:");
        if (!confidencePart) {
            console.error("No 'Confidence:' found in line:", predictedLine);
            return res.status(500).json({ success: false, message: "Prediction parsing error" });
        }

        // Remove trailing commas/spaces
        const trimmedClass = classPart.replace(",", "").trim();
        // Extract category from trimmedClass:
        const [classNumber, ...rest] = trimmedClass.split(" ");
        const category = rest.join(" ").trim(); // FIXED HERE// e.g., "Non Recyclable"

        // Now that category is defined, get additional details from waste_info.json:
        const wasteDetails = wasteInfo[category] || {};

        // Clean up confidence
        const confidence = confidencePart.trim(); // e.g., "0.96"

        // Save prediction to MSSQL
        try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
        .input('Filename', sql.NVarChar, req.file.filename)
        .input('Category', sql.NVarChar, category)
        .input('Confidence', sql.Float, parseFloat(confidence))
        .query(`INSERT INTO Predictions (Filename, Category, Confidence) VALUES (@Filename, @Category, @Confidence)`);
        } catch (err) {
        console.error("Error saving prediction to DB:", err);
        }


        // Final JSON response including extra waste info details:
        return res.json({
            success: true,
            message: "Prediction successful",
            category: category,
            confidence: confidence,
            file: `http://localhost:3000/images/${req.file.filename}`,
            type: wasteDetails.type || "Unknown",
            methods: wasteDetails.methods || ["No information available"],
            disposal: wasteDetails.disposal || "No disposal info",
            environmental_impact: wasteDetails.environmental_impact || "Unknown",
            examples: wasteDetails.examples || ["No examples available"]
        });        
    });
});


// server.js or routes.js
app.post("/updateProfile", async (req, res) => {
  
    const { newusername, oldusername, password, mobile } = req.body;
    if (!newusername || !oldusername || !password || !mobile) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
  
    try {
      const pool = await sql.connect(dbConfig);
  
      const result = await pool.request()
        .input("OldUsername", sql.NVarChar, oldusername)
        .input("NewUsername", sql.NVarChar, newusername)
        .input("Password", sql.NVarChar, password)
        .input("Mobile", sql.NVarChar, mobile)
        .query(
          "UPDATE Users SET Username = @NewUsername, Password = @Password, Mobile = @Mobile WHERE Username = @OldUsername"
        );
  
      console.log("Updated the Profile !"); // Log result
      if (result.rowsAffected[0] === 0) {
        return res.json({ success: false, message: "No user found with that username" });
      }
  
      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ success: false, message: "Database error." });
    }
  });
  
  // Update admin
// Update admin
app.put("/update-admin", async (req, res) => {
    try {
        const { ID, Name, Password, Mobile } = req.body;

        // 1) Connect to DB using dbConfig
        const pool = await sql.connect(dbConfig);

        // 2) Use bracket notation for columns that might be keywords or special
        //    Also confirm you actually have columns "Name", "Password", "Mobile", "ID" in your table.
        await pool.request()
            .input("ID", sql.Int, ID)
            .input("Name", sql.NVarChar, Name)
            .input("Password", sql.NVarChar, Password)
            .input("Mobile", sql.NVarChar, Mobile)
            .query(`
                UPDATE dbo.Admin
                SET [Name] = @Name,
                    [Password] = @Password,
                    [Mobile] = @Mobile
                WHERE [ID] = @ID
            `);

        res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
        console.error("Error updating admin:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET users route
app.get('/get-users', async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request().query("SELECT * FROM Users");
      res.json(result.recordset);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Database error" });
    }
  });
  
// PUT route to update a user
app.put('/update-user', async (req, res) => {
    const { ID, Username, Email, Mobile, Premium } = req.body;
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input("ID", sql.Int, ID)
        .input("Username", sql.NVarChar, Username)
        .input("Email", sql.NVarChar, Email)
        .input("Mobile", sql.NVarChar, Mobile)
        .input("Premium", sql.NVarChar, Premium)
        .query("UPDATE Users SET Username = @Username, Email = @Email, Mobile = @Mobile, Premium = @Premium WHERE ID = @ID");
      
      if (result.rowsAffected[0] > 0) {
        res.json({ message: "User details updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Database error", error: error.message });
    }
  });

  app.delete('/delete-user/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    console.log("Delete route hit for ID:", userId);
  
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input("ID", sql.Int, userId)
        .query("DELETE FROM Users WHERE ID = @ID");
  
      if (result.rowsAffected[0] > 0) {
        res.json({ message: "User deleted successfully!" });
      } else {
        res.status(404).json({ message: "User not found!" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user", error: error.message });
    }
  });
  
  

// API Endpoint to handle feedback submission
app.post("/submit-feedback", async (req, res) => {
    const { name, email, feedback } = req.body;

    // Validate feedback length
    if (feedback.length < 25) {
        return res.json({ success: false, message: "Feedback must be at least 25 characters long." });
    }

    try {
        let pool = await sql.connect(dbConfig);

        // Check if user exists
        let userCheck = await pool.request()
            .input("name", sql.NVarChar, name)
            .input("email", sql.NVarChar, email)
            .query("SELECT * FROM Users WHERE Username = @name AND Email = @email");

        if (userCheck.recordset.length === 0) {
            return res.json({ success: false, message: "User not found. Please check your name and email." });
        }

        // Insert feedback
        await pool.request()
            .input("name", sql.NVarChar, name)
            .input("email", sql.NVarChar, email)
            .input("feedback", sql.NVarChar, feedback)
            .query("UPDATE Users SET Feedback = @feedback, FeedbackDate = GETDATE() WHERE Username = @name AND Email = @email");

        res.json({ success: true });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
});

app.get('/feedback-stats', async (req, res) => {
    try {
      let pool = await sql.connect(dbConfig);
      let result = await pool.request().query("SELECT Feedback FROM Users WHERE Feedback IS NOT NULL");
  
      let positive = 0;
      let negative = 0;
  
      const positiveWords = ['good', 'great', 'awesome', 'excellent', 'amazing', 'helpful', 'loved', 'like', 'nice', 'cool'];
      const negativeWords = ['bad', 'poor', 'worst', 'terrible', 'dislike', 'hate', 'buggy', 'slow', 'not working'];
  
      result.recordset.forEach(entry => {
        let feedback = entry.Feedback.toLowerCase();
        let posMatch = positiveWords.some(word => feedback.includes(word));
        let negMatch = negativeWords.some(word => feedback.includes(word));
  
        if (posMatch && !negMatch) positive++;
        else if (negMatch && !posMatch) negative++;
      });
  
      res.json({ positive, negative });
    } catch (error) {
      console.error("Error getting feedback stats:", error);
      res.status(500).json({ error: "Server error while fetching feedback stats." });
    }
  });

// 🟢 Profile Page Route
app.get('/profile', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');

    try {
        const result = await sql.query`SELECT * FROM Users WHERE ID = ${userId}`;
        const user = result.recordset[0];
        res.render('profile', { user });
    } catch (err) {
        console.error('Error loading profile:', err);
        res.status(500).send('Something went wrong');
    }
});

// 🟢 Upload Profile Photo (Profile Picture Upload Route)
app.post('/uploadProfile', profileUpload.single('profilePhoto'), async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');

    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const filename = req.file.filename;

    try {
        await sql.query`UPDATE Users SET profileimg = ${filename} WHERE ID = ${userId}`;
        res.redirect('/home');
    } catch (err) {
        console.error('Error saving photo:', err);
        res.status(500).send('Photo upload failed');
    }
});

app.get('/home', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');  // Prevent access if not logged in

    try {
        const result = await sql.query`SELECT * FROM Users WHERE ID = ${userId}`;
        const user = result.recordset[0];
        res.render('home', { user });
    } catch (err) {
        console.error("Error loading home:", err);
        res.status(500).send("Error loading home page.");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Logout error:", err);
            return res.status(500).send("Error logging out.");
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.redirect('/index.html');
    });
});


// GET total waste classified (count files in images folder)
app.get('/dashboard/total-waste', (req, res) => {
    const imagesDir = path.join(__dirname, 'images');
    fs.readdir(imagesDir, (err, files) => {
      if (err) {
        console.error('Error reading images folder:', err);
        return res.status(500).json({ error: 'Could not read images directory' });
      }
  
      // Filter out non-waste files like 'profile.png'
      const wasteFiles = files.filter(file => file !== 'profile.png');
  
      res.json({ totalWaste: wasteFiles.length });
    });
  });


  app.delete('/delete-all-waste', (req, res) => {
    const imagesDir = path.join(__dirname, 'images');
  
    fs.readdir(imagesDir, (err, files) => {
      if (err) {
        console.error("Error reading image directory:", err);
        return res.status(500).json({ message: "Failed to read image folder" });
      }
  
      const deletableFiles = files.filter(file => file !== 'profile.png');
  
      if (deletableFiles.length === 0) {
        return res.json({ message: "No waste images to delete." });
      }
  
      deletableFiles.forEach(file => {
        const filePath = path.join(imagesDir, file);
        fs.unlink(filePath, err => {
          if (err) console.error("Error deleting file:", filePath, err);
        });
      });
  
      res.json({ message: "All waste images deleted successfully!" });
    });
  });
  
  const predictionFeedbackPath = path.join(__dirname, 'prediction_feedback.json');

// Ensure the file exists on server start
if (!fs.existsSync(predictionFeedbackPath)) {
  fs.writeFileSync(predictionFeedbackPath, JSON.stringify({ correct: 0, incorrect: 0 }, null, 2));
}

// Endpoint to record feedback
app.post('/record-prediction-feedback', (req, res) => {
  const { isCorrect } = req.body;

  fs.readFile(predictionFeedbackPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: "Read error" });

    const feedback = JSON.parse(data);
    if (isCorrect) {
      feedback.correct += 1;
    } else {
      feedback.incorrect += 1;
    }

    fs.writeFile(predictionFeedbackPath, JSON.stringify(feedback, null, 2), err => {
      if (err) return res.status(500).json({ message: "Write error" });
      res.json({ message: "Feedback recorded" });
    });
  });
});

// Endpoint to fetch counts
app.get('/dashboard/prediction-feedback', (req, res) => {
  fs.readFile(predictionFeedbackPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ correct: 0, incorrect: 0 });
    const feedback = JSON.parse(data);
    res.json(feedback);
  });
});

// ✅ Get Top 3 Feedbacks from Users Table
app.get('/top-feedbacks', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT TOP 3 Username, Feedback, profileimg
      FROM Users
      WHERE Feedback IS NOT NULL
      ORDER BY LEN(Feedback) DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching top feedbacks:", error);
    res.status(500).json({ error: "Server error while fetching feedbacks." });
  }
});

  
  // GET: Waste Type Distribution chart
  app.get('/waste-type-distribution', async (req, res) => {
    try {
      let pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .query(`SELECT Category, COUNT(*) AS Count FROM Predictions GROUP BY Category`);
  
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching waste type distribution:', error);
      res.status(500).json({ error: 'Server error while fetching waste data.' });
    }
  });

  //uploads each day of every class

  app.get('/uploads-over-time', async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request().query(`
        SELECT 
          FORMAT(CreatedAt, 'yyyy-MM-dd') AS UploadDate,
          COUNT(*) AS Count
        FROM Predictions
        WHERE CreatedAt >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
        GROUP BY FORMAT(CreatedAt, 'yyyy-MM-dd')
        ORDER BY UploadDate ASC
      `);
  
      const labels = [];
      const counts = [];
  
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
  
        const formatted = date.toISOString().split('T')[0];
        labels.push(formatted);
  
        const found = result.recordset.find(row => row.UploadDate === formatted);
        counts.push(found ? found.Count : 0);
      }
  
      res.json({ labels, counts });
    } catch (error) {
      console.error("Error fetching uploads over time:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  
  app.get('/top-waste-categories', async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request().query(`
        SELECT Category, COUNT(*) AS Count
        FROM Predictions
        GROUP BY Category
        ORDER BY Count DESC
      `);
      res.json(result.recordset);
    } catch (error) {
      console.error("Error fetching top waste categories:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  

  app.get('/average-confidence-over-time', async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request().query(`
        SELECT 
          FORMAT(CreatedAt, 'yyyy-MM-dd') AS Day,
          AVG(Confidence) * 100 AS AvgConfidencePct
        FROM [WebAppDB].[dbo].[Predictions]
        WHERE CreatedAt >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
        GROUP BY FORMAT(CreatedAt, 'yyyy-MM-dd')
        ORDER BY Day ASC
      `);
  
      const today = new Date();
      const labels = [];
      const avgConfidence = [];
  
      for (let i = 6; i >= 0; i--) {
        const dt = new Date(today);
        dt.setDate(today.getDate() - i);
        const dayKey = dt.toISOString().slice(0,10);
  
        labels.push(dayKey);
        const row = result.recordset.find(r => r.Day === dayKey);
        if (row) {
          avgConfidence.push(Math.round(row.AvgConfidencePct));  // integer percent
        } else {
          avgConfidence.push(0);
        }
      }
  
      res.json({ labels, avgConfidence });
    } catch (err) {
      console.error("Error fetching avg confidence:", err);
      res.status(500).json({ error: "Server error" });
    }
  });
  
  app.get("/all-feedbacks", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in." });
  
    try {
      const pool = await sql.connect(dbConfig);
      const currentUser = await pool.request()
        .input("ID", sql.Int, userId)
        .query(`SELECT Email FROM Users WHERE ID = @ID`);
  
      const result = await pool.request().query(`
        SELECT Username, Email, Feedback, profileimg
        FROM Users
        WHERE Feedback IS NOT NULL
        ORDER BY FeedbackDate DESC
      `);
  
      res.json({
        feedbacks: result.recordset,
        currentEmail: currentUser.recordset[0].Email
      });
    } catch (error) {
      console.error("Error fetching all feedbacks:", error);
      res.status(500).json({ error: "Server error." });
    }
  });
  
  

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//or run the link-   http://localhost:3000/login