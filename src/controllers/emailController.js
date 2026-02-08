import { sendMailViaGraph } from "../utils/sendMailGraph.js";
import { createTeamsMeeting } from "../utils/createTeamsMeeting.js";

/* ================= EMAIL TEMPLATES ================= */

export const teamsInterviewTemplate = ({
  candidateName,
  interviewDate,
  interviewer,
  meetingLink
}) => `
  <h3>Interview Scheduled – Microsoft Teams</h3>
  <p>Dear ${candidateName || "Candidate"},</p>

  <p>Your interview has been scheduled with our team.</p>

  <p><b>Date & Time:</b> ${interviewDate}</p>
  <p><b>Interviewer:</b> ${interviewer}</p>

  <p><b>Microsoft Teams Link:</b></p>
  <p><a href="${meetingLink}">${meetingLink}</a></p>

  <br/>
  <p>Best regards,<br/>
  Univision HR Team</p>
`;

export const googleMeetInterviewTemplate = ({
  candidateName,
  interviewDate,
  interviewer,
  meetingLink
}) => `
  <h3>Interview Scheduled – Google Meet</h3>
  <p>Dear ${candidateName || "Candidate"},</p>

  <p>Your interview has been scheduled with our team.</p>

  <p><b>Date & Time:</b> ${interviewDate}</p>
  <p><b>Interviewer:</b> ${interviewer}</p>

  <p><b>Google Meet Link:</b></p>
  <p><a href="${meetingLink}">${meetingLink}</a></p>

  <br/>
  <p>Best regards,<br/>
  Univision HR Team</p>
`;

/* ================= SEND EMAIL ================= */

export const sendInterviewEmail = async (req, res) => {
  try {
    const {
      candidate_email,
      scheduled_date,
      interviewer,
      candidateName,
    } = req.body;

    console.log("📅 Scheduled date:", scheduled_date);

    const meetingLink = await createTeamsMeeting({
      subject: `Interview with ${candidateName}`,
      startDateTime: new Date(scheduled_date).toISOString(),
      endDateTime: new Date(
        new Date(scheduled_date).getTime() + 30 * 60000
      ).toISOString(),
      attendeesEmails: [candidate_email],
    });

    console.log("🔗 Final Teams Link:", meetingLink);

    const html = teamsInterviewTemplate({
      candidateName,
      interviewDate: scheduled_date,
      interviewer,
      meetingLink,
    });

    await sendMailViaGraph({
      to: candidate_email,
      subject: "Univision: Interview Scheduled",
      html,
    });

    res.json({
      message: "Interview email sent with Teams meeting link",
      meetingLink,
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
};


// export const sendInterviewEmail = async (req, res) => {
//   try {
//     const {
//       candidate_email,
//       interview_date,
//       interview_type,
//       interviewer,
//       meetingLink,
//       candidateName
//     } = req.body;

//     console.log("📧 Sending interview email via Graph to:", candidate_email);

//     const html =
//       interview_type === "Teams"
//         ? teamsInterviewTemplate({
//             candidateName,
//             interviewDate: interview_date,
//             interviewer,
//             meetingLink,
//           })
//         : googleMeetInterviewTemplate({
//             candidateName,
//             interviewDate: interview_date,
//             interviewer,
//             meetingLink,
//           });

//     await sendMailViaGraph({
//       to: candidate_email,
//       subject: "Univision: Interview Scheduled",
//       html,
//     });

//     console.log("✅ Interview email sent via Graph");
//     res.json({ message: "Interview email sent successfully" });

//   } catch (error) {
//     console.error("❌ Graph email error:", error.response?.data || error);
//     res.status(500).json({ error: "Failed to send interview email" });
//   }
// };

// import { gmailTransporter } from '../config/email.js';

// export const teamsInterviewTemplate = ({
//   candidateName,
//   interviewDate,
//   interviewer,
//   meetingLink
// }) => `
//   <h3>Interview Scheduled – Microsoft Teams</h3>
//   <p>Dear ${candidateName || "Candidate"},</p>

//   <p>Your interview has been scheduled with our team.</p>

//   <p><b>Date & Time:</b> ${interviewDate}</p>
//   <p><b>Interviewer:</b> ${interviewer}</p>

//   <p><b>Microsoft Teams Link:</b></p>
//   <p><a href="${meetingLink}">${meetingLink}</a></p>

//   <br/>
//   <p>Best regards,<br/>
//   Univision HR Team</p>
// `;

// export const googleMeetInterviewTemplate = ({
//   candidateName,
//   interviewDate,
//   interviewer,
//   meetingLink
// }) => `
//   <h3>Interview Scheduled – Google Meet</h3>
//   <p>Dear ${candidateName || "Candidate"},</p>

//   <p>Your interview has been scheduled with our team.</p>

//   <p><b>Date & Time:</b> ${interviewDate}</p>
//   <p><b>Interviewer:</b> ${interviewer}</p>

//   <p><b>Google Meet Link:</b></p>
//   <p><a href="${meetingLink}">${meetingLink}</a></p>

//   <br/>
//   <p>Best regards,<br/>
//   Univision HR Team</p>
// `;

// // import { gmailTransporter } from '../config/email.js';

// export const sendInterviewEmail = async (req, res) => {
//   try {
//     const { candidate_email, interview_date, interview_type, interviewer } = req.body;

//     console.log('📧 Sending interview email to:', candidate_email);

//     const mailOptions = {
//       from: process.env.GMAIL_EMAIL,
//       to: candidate_email,
//       subject: 'Univision: Interview Scheduled',
//       html: `
//         <h3>Interview Scheduled</h3>
//         <p><b>Date:</b> ${interview_date}</p>
//         <p><b>Type:</b> ${interview_type}</p>
//         <p><b>Interviewer:</b> ${interviewer}</p>
//         <br/>
//         <p>Best regards,<br/>HR Team</p>
//       `,
//     };

//     await gmailTransporter.sendMail(mailOptions);

//     console.log('✅ Interview email sent');
//     res.json({ message: 'Interview email sent' });

//   } catch (error) {
//     console.error('❌ Email send error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
