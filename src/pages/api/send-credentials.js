// pages/api/send-credentials.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { students, examName } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: 'No students selected.' });
    }

    const smtpUser = process.env.GMAIL_USER;
    const smtpPass = process.env.GMAIL_APP_PASSWORD;

    if (!smtpUser || !smtpPass) {
        console.error('SMTP credentials are not set in environment variables.');
        return res.status(500).json({ message: 'Server configuration error: GMAIL_USER or GMAIL_APP_PASSWORD is not set.' });
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, 
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    try {
        const emailPromises = students.map(student => {
            const mailOptions = {
                from: `"NIELIT Tezpur EC Exam Portal" <${smtpUser}>`,
                to: student.email,
                subject: `Your Login Credentials for the Exam: ${examName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Login Credentials for NIELIT Tezpur EC Exam</h2>
                        <p>Hello ${student.name},</p>
                        <p>You have been enrolled in the upcoming exam: <strong>${examName}</strong>.</p>
                        <p>Please use the following credentials to log in to the student portal:</p>
                        <ul>
                            <li><strong>Email:</strong> ${student.email}</li>
                            <li><strong>Password:</strong> ${student.password}</li>
                        </ul>
                        <p>You can log in at <a href="${req.headers.origin}/login">our portal</a>.</p>
                        <p>Best of luck!</p>
                        <p>--<br>NIELIT Tezpur EC</p>
                    </div>
                `,
            };
            return transporter.sendMail(mailOptions);
        });

        await Promise.all(emailPromises);
        res.status(200).json({ message: 'Credentials sent successfully!' });

    } catch (error) {
        console.error('Error sending emails:', error);
        
        // Provide more specific feedback to the frontend
        let errorMessage = 'Failed to send one or more emails.';
        if (error.responseCode === 535 || error.code === 'EAUTH') {
            errorMessage += ' Authentication failed. Please double-check your GMAIL_USER and GMAIL_APP_PASSWORD in the .env.local file and ensure 2-Step Verification is enabled for the account.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage += ' Could not connect to the SMTP server. Please check your network connection and firewall settings.';
        }

        res.status(500).json({ message: errorMessage });
    }
}