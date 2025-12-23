// Real room coordinates and categories from the database (FSKTM Faculty)
const ROOMS_DATA = [
  // Block A Rooms
  { block: "Block A", room: "MM1 Lab", lat: 3.128244, lon: 101.650775 },
  { block: "Block A", room: "MM3 Lab", lat: 3.128377, lon: 101.650647 },
  { block: "Block A", room: "Robotic Lab", lat: 3.128343, lon: 101.650542 },
  { block: "Block A", room: "CCNA Lab", lat: 3.128376, lon: 101.65056 },
  { block: "Block A", room: "BK1", lat: 3.128204, lon: 101.650476 },
  { block: "Block A", room: "BK2", lat: 3.128095, lon: 101.650699 },
  { block: "Block A", room: "Foyer A", lat: 3.12824, lon: 101.650615 },
  { block: "Block A", room: "The Cube", lat: 3.128206, lon: 101.65075 },
  { block: "Block A", room: "ML Lab", lat: 3.128342, lon: 101.650707 },
  // Block B Rooms
  { block: "Block B", room: "MM2", lat: 3.128605, lon: 101.650092 },
  { block: "Block B", room: "MM4", lat: 3.128628, lon: 101.65002 },
  { block: "Block B", room: "MM5", lat: 3.128584, lon: 101.650075 },
  { block: "Block B", room: "MM6", lat: 3.128486, lon: 101.65027 },
  { block: "Block B", room: "Foyer B", lat: 3.128312, lon: 101.650117 },
  { block: "Block B", room: "Student Lounge", lat: 3.128458, lon: 101.650134 },
  { block: "Block B", room: "DK1", lat: 3.128396, lon: 101.64986 },
  { block: "Block B", room: "DK2", lat: 3.128566, lon: 101.649916 },
];

const CATEGORIES_DATA = [
  { name: "Cleanliness", priority: "Low" },
  { name: "Vandalism", priority: "Medium" },
  { name: "Bullying", priority: "High" },
  { name: "Academic Misconduct", priority: "Medium" },
  { name: "Property Damage", priority: "High" },
  { name: "Noise Violation", priority: "Low" },
  { name: "Unauthorized Access", priority: "High" },
  { name: "Academic Issues", priority: "Medium" },
];

const COMPLAINT_TEMPLATES = {
  "Cleanliness": [
    { title: "Dirty Classroom Floor", desc: "The classroom floor has not been cleaned for days. Food wrappers and dust everywhere." },
    { title: "Overflowing Trash Bins", desc: "Trash bins overflowing with bad smell and attracting pests." },
    { title: "Sticky Desk Surface", desc: "Desk surface is sticky and requires immediate cleaning." },
    { title: "Mold in Bathroom", desc: "Black mold growth detected, serious health hazard." },
    { title: "Dirty Carpet", desc: "Large stains on carpet that have never been cleaned properly." },
    { title: "Food Contamination in Lab", desc: "Food residue and contamination found in the laboratory." },
    { title: "Accumulated Dust", desc: "Dust accumulation affecting air quality and visibility." },
    { title: "Broken Sink", desc: "Water damage and fixture malfunction in restroom." },
    { title: "Grimy Windows", desc: "Windows covered in grime making visibility impossible." },
    { title: "Dirty Floor Tiles", desc: "Floor tiles have not been properly cleaned, showing stains." },
  ],
  "Vandalism": [
    { title: "Graffiti on Wall", desc: "Inappropriate content written on multiple walls." },
    { title: "Damaged Door Handle", desc: "Door handle torn off making door unusable." },
    { title: "Broken Chair", desc: "Chair wood broken in multiple places, unsafe." },
    { title: "Scratched Desk", desc: "Deep scratches and marks covering entire desk surface." },
    { title: "Defaced Table", desc: "Table surface permanently marked with pen." },
    { title: "Torn Bulletin Board", desc: "Board torn and ripped, information destroyed." },
    { title: "Dented Locker", desc: "Multiple dents and indentations on locker." },
    { title: "Broken Window", desc: "Window glass cracked, urgent safety issue." },
    { title: "Damaged Cabinet", desc: "Cabinet door damaged and difficult to open." },
    { title: "Marked Walls", desc: "Permanent marker all over the walls." },
  ],
  "Bullying": [
    { title: "Student Harassment", desc: "Student witnessed being targeted and mocked by peers." },
    { title: "Exclusionary Behavior", desc: "Student excluded from group activities intentionally." },
    { title: "Verbal Abuse", desc: "Derogatory language and insults directed at student." },
    { title: "Intimidation", desc: "Intimidation tactics used to prevent participation." },
    { title: "Group Bullying", desc: "Multiple students ganging up on one individual." },
    { title: "Threatening Messages", desc: "Threatening messages received via communication." },
    { title: "Physical Intimidation", desc: "Physical aggression and threatening behavior." },
    { title: "Social Exclusion", desc: "Systematic exclusion from social groups." },
    { title: "Cyberbullying", desc: "Negative comments and harassment online." },
    { title: "Mockery", desc: "Constant mocking and ridiculing of student." },
  ],
  "Academic Misconduct": [
    { title: "Cheating During Exam", desc: "Unauthorized materials found during examination." },
    { title: "Plagiarism Suspected", desc: "Written content directly copied without attribution." },
    { title: "Unauthorized Collaboration", desc: "Students working together on individual assignments." },
    { title: "Answer Sharing", desc: "Answer sheets shared between exam takers." },
    { title: "Content Plagiarism", desc: "Extensive plagiarism from online sources." },
    { title: "Test Impersonation", desc: "Different student took exam on behalf of another." },
    { title: "Database Misuse", desc: "Unauthorized database queries and data access." },
    { title: "Assignment Copy", desc: "Assignment directly copied from another student." },
    { title: "Exam Cheating", desc: "Clear evidence of answer sheet copying." },
    { title: "Source Omission", desc: "References not cited properly in assignment." },
  ],
  "Property Damage": [
    { title: "Broken Monitor", desc: "Computer monitor screen broken and non-functional." },
    { title: "Damaged Projector", desc: "Projector damaged and cannot operate." },
    { title: "Stolen Laptop", desc: "Device missing from secure storage area." },
    { title: "Broken Lab Equipment", desc: "Sensitive lab equipment damaged beyond repair." },
    { title: "Damaged Lock", desc: "Door lock mechanism damaged, door unsecured." },
    { title: "Broken Light", desc: "Light fixture broken, area dark and unsafe." },
    { title: "Damaged Cabinet", desc: "Cabinet door damaged, difficult to open." },
    { title: "Missing Keyboard", desc: "Keyboard device missing from workstation." },
    { title: "Broken Desk", desc: "Desk surface cracked and unstable." },
    { title: "Damaged Chair", desc: "Chair frame broken and unsafe to sit on." },
  ],
  "Noise Violation": [
    { title: "Excessive Noise", desc: "Excessive sound levels disrupting concentration." },
    { title: "Construction Noise", desc: "Heavy machinery operating during quiet hours." },
    { title: "Loud Music", desc: "Audio system playing loudly despite rules." },
    { title: "Loud Discussion", desc: "Group members talking very loudly." },
    { title: "Equipment Noise", desc: "Mechanical noise from equipment malfunction." },
    { title: "Renovation Noise", desc: "Construction activities during study time." },
    { title: "Amplifier Issues", desc: "Audio amplification system too loud." },
    { title: "Event Disturbance", desc: "Event creating disturbance to other users." },
    { title: "Door Slamming", desc: "Constant slamming of doors throughout day." },
    { title: "Machinery Malfunction", desc: "Loud machinery running unexpectedly." },
  ],
  "Unauthorized Access": [
    { title: "Unauthorized Entry", desc: "Person without credentials entering restricted area." },
    { title: "Card Misuse", desc: "Access card used by unauthorized person." },
    { title: "Security Bypass", desc: "Security measure bypassed by unauthorized entry." },
    { title: "Building Access", desc: "Building entered without proper permission." },
    { title: "Door Left Open", desc: "Security door left open allowing access." },
    { title: "Gate Bypass", desc: "Secured gate open without authorization." },
    { title: "Credential Sharing", desc: "Access credentials shared with unauthorized users." },
    { title: "Equipment Use", desc: "Equipment used by person without training." },
    { title: "Lab Access", desc: "Lab accessed by non-authorized personnel." },
    { title: "Room Entry", desc: "Restricted room entered without permission." },
  ],
  "Academic Issues": [
    { title: "Unfair Grading", desc: "Grade received does not match effort and understanding." },
    { title: "Missing Feedback", desc: "Examination results returned without feedback." },
    { title: "Material Not Updated", desc: "Required course materials not uploaded." },
    { title: "Unclear Instructions", desc: "Assignment instructions unclear and ambiguous." },
    { title: "Missing Resources", desc: "Important resources unavailable to students." },
    { title: "Missing Notes", desc: "Lecture transcripts and notes missing." },
    { title: "Grading Error", desc: "Grade calculation appears incorrect." },
    { title: "Syllabus Confusion", desc: "Course plan and expectations not clear." },
    { title: "Late Material", desc: "Course content provided very late." },
    { title: "Incomplete Slides", desc: "Lecture slides incomplete and disorganized." },
  ],
};

const USERNAMES = [
  "Testing1.", "StudentA", "StudentB", "StudentC", "StudentD", "StudentE",
  "StudentF", "StudentG", "StudentH", "StudentI", "StudentJ", "John_Doe",
  "Jane_Smith", "Alex_Lee", "Maria_Garcia", "Chen_Wei", "Priya_Kumar",
];

const ADMINS = [
  { id: "68af04187c2e6f499854e2da", name: "Teoh Zong Ming" },
  { id: "68af04187c2e6f499854e2db", name: "Chong Gin Khai" },
  { id: "6931a3456abf5a33c813bf8c", name: "Saw Kent Ming" },
];

const STATUSES = ["Opened", "InProgress", "Resolved"];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Counter for generating sequential IDs per month
const monthCounters = {};

function generateComplaint(index) {
  const category = getRandomItem(CATEGORIES_DATA);
  const template = getRandomItem(COMPLAINT_TEMPLATES[category.name]);
  const room = getRandomItem(ROOMS_DATA);
  
  // Increase Opened and InProgress complaints (40% Opened, 35% InProgress, 25% Resolved)
  let status;
  const rand = Math.random();
  if (rand < 0.40) {
    status = "Opened";
  } else if (rand < 0.75) {
    status = "InProgress";
  } else {
    status = "Resolved";
  }
  
  const admin = status !== "Opened" && Math.random() > 0.2 ? getRandomItem(ADMINS) : null;
  
  const startDate = new Date("2025-10-01");
  const endDate = new Date("2025-12-11");
  const timeSpan = endDate - startDate;
  const offset = (index / 100) * timeSpan;
  const createdDate = new Date(startDate.getTime() + offset);
  createdDate.setHours(Math.floor(Math.random() * 24));
  createdDate.setMinutes(Math.floor(Math.random() * 60));
  
  // Generate month-based ID
  const year = createdDate.getFullYear();
  const month = String(createdDate.getMonth() + 1).padStart(2, '0');
  const monthKey = `${year}${month}`;
  
  if (!monthCounters[monthKey]) {
    monthCounters[monthKey] = 1;
  }
  const sequentialNumber = monthCounters[monthKey]++;
  const displayId = `RPT-${monthKey}-${sequentialNumber}`;
  
  const username = getRandomItem(USERNAMES);
  let updatedDate = new Date(createdDate);
  let assignedDate = null;
  let inProgressDate = null;
  let resolvedDate = null;
  
  if (status === "Resolved") {
    // Resolved: Submit -> Assigned (1-3 days) -> InProgress (immediately) -> Resolved (5-30 days)
    assignedDate = new Date(createdDate);
    assignedDate.setDate(assignedDate.getDate() + Math.floor(Math.random() * 3) + 1);
    
    inProgressDate = new Date(assignedDate);
    inProgressDate.setMinutes(inProgressDate.getMinutes() + Math.floor(Math.random() * 30) + 5);
    
    resolvedDate = new Date(inProgressDate);
    resolvedDate.setDate(resolvedDate.getDate() + Math.floor(Math.random() * 26) + 5);
    
    updatedDate = resolvedDate;
  } else if (status === "InProgress") {
    assignedDate = new Date(createdDate);
    assignedDate.setDate(assignedDate.getDate() + Math.floor(Math.random() * 3) + 1);
    
    inProgressDate = new Date(assignedDate);
    inProgressDate.setMinutes(inProgressDate.getMinutes() + Math.floor(Math.random() * 30) + 5);
    
    updatedDate = inProgressDate;
  }
  
  const id = `019a926d-e235-${String(index).padStart(4, '0')}-a590-735375474e${String(index % 100).padStart(2, '0')}`;
  
  // Build timeline history
  const timelineHistory = [
    {
      id: `${id}-evt-1`,
      reportId: id,
      actionTitle: "Report Submitted",
      actionDetails: `Complaint submitted by user ${username}.`,
      initiator: username,
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
      version: 1,
    },
  ];
  
  if (assignedDate && admin) {
    timelineHistory.push({
      id: `${id}-evt-2`,
      reportId: id,
      actionTitle: "Admin Assigned",
      actionDetails: `Admin ${admin.name} assigned to complaint.`,
      initiator: "System",
      createdAt: assignedDate.toISOString(),
      updatedAt: assignedDate.toISOString(),
      version: 1,
    });
  }
  
  if (inProgressDate && admin) {
    timelineHistory.push({
      id: `${id}-evt-3`,
      reportId: id,
      actionTitle: "Status Updated",
      actionDetails: "Status changed to InProgress.",
      initiator: admin.name,
      createdAt: inProgressDate.toISOString(),
      updatedAt: inProgressDate.toISOString(),
      version: 1,
    });
  }
  
  if (resolvedDate && admin) {
    timelineHistory.push({
      id: `${id}-evt-4`,
      reportId: id,
      actionTitle: "Status Updated",
      actionDetails: "Status changed to Resolved.",
      initiator: admin.name,
      createdAt: resolvedDate.toISOString(),
      updatedAt: resolvedDate.toISOString(),
      version: 1,
    });
  }
  
  const complaint = {
    id,
    displayId,
    userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
    username,
    adminId: admin?.id || null,
    adminName: admin?.name || "Unassigned",
    facultyid: "6915cd5e4297c05ff2598c55",
    status,
    title: template.title,
    description: template.desc,
    category,
    media: Math.random() > 0.7 ? ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80"] : [],
    timelineHistory,
    latitude: room.lat,
    longitude: room.lon,
    facultyLocation: {
      faculty: "Faculty of Computer Science and Information Technology",
      facultyBlock: room.block,
      facultyBlockRoom: room.room,
    },
    isAnonymous: Math.random() > 0.8,
    isFeedbackProvided: status === "Resolved" && Math.random() > 0.3,
    chatroomId: status === "Resolved" ? `ROOM-${id.substring(0, 8)}` : "",
    createdAt: createdDate.toISOString(),
    updatedAt: updatedDate.toISOString(),
    version: status === "Resolved" ? Math.floor(Math.random() * 15) + 3 : Math.floor(Math.random() * 5) + 1,
  };
  
  if (complaint.isFeedbackProvided) {
    const feedbackDate = new Date(updatedDate.getTime() + 3600000);
    complaint.feedback = {
      id: `feedback-${id}`,
      reportId: id,
      q1Rating: Math.floor(Math.random() * 5) + 1,
      q2Rating: Math.floor(Math.random() * 5) + 1,
      overallComment: ["Excellent service", "Very satisfied", "Good response", "Could improve"][Math.floor(Math.random() * 4)],
      createdAt: feedbackDate.toISOString(),
      updatedAt: feedbackDate.toISOString(),
      version: 1,
    };
    
    // Add feedback event to timeline
    timelineHistory.push({
      id: `${id}-evt-5`,
      reportId: id,
      actionTitle: "Feedback Provided",
      actionDetails: "User submitted feedback after resolution.",
      initiator: username,
      createdAt: feedbackDate.toISOString(),
      updatedAt: feedbackDate.toISOString(),
      version: 1,
    });
  }
  
  return complaint;
}

export const MOCK_COMPLAINTS = Array.from({ length: 100 }, (_, i) => generateComplaint(i))
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// Add chat messages to the 5 latest complaints
const addChatDataToLatestComplaints = () => {
  const complaintsWithChat = MOCK_COMPLAINTS.slice(0, 5);
  
  complaintsWithChat.forEach((complaint, index) => {
    const chatMessages = [];
    const baseTime = new Date(complaint.createdAt);
    
    // Initial message from student after report submission
    if (complaint.adminId) {
      // Conversation 1: Student asks for update
      const msg1Time = new Date(baseTime.getTime() + 3600000 * 2); // 2 hours after submission
      chatMessages.push({
        id: `${complaint.id}-msg-1`,
        chatroomId: complaint.chatroomId || `ROOM-${complaint.id.substring(0, 8)}`,
        senderId: complaint.userId,
        senderName: complaint.username,
        senderRole: "student",
        message: index % 2 === 0 
          ? "Hi, I submitted this complaint earlier today. When can I expect someone to look into this issue?"
          : "Hello, just wanted to check if this has been reviewed yet. It's quite urgent.",
        timestamp: msg1Time.toISOString(),
        isRead: true,
      });
      
      // Admin response
      const msg2Time = new Date(msg1Time.getTime() + 1800000); // 30 min later
      chatMessages.push({
        id: `${complaint.id}-msg-2`,
        chatroomId: complaint.chatroomId || `ROOM-${complaint.id.substring(0, 8)}`,
        senderId: complaint.adminId,
        senderName: complaint.adminName,
        senderRole: "admin",
        message: index % 2 === 0
          ? `Hello ${complaint.username}, thank you for reporting this. I've been assigned to your case and will investigate this matter shortly.`
          : `Hi ${complaint.username}, I've reviewed your complaint. Our team is working on resolving this issue as soon as possible.`,
        timestamp: msg2Time.toISOString(),
        isRead: true,
      });
      
      // Conversation 2: Follow-up discussion
      const msg3Time = new Date(msg2Time.getTime() + 7200000); // 2 hours later
      chatMessages.push({
        id: `${complaint.id}-msg-3`,
        chatroomId: complaint.chatroomId || `ROOM-${complaint.id.substring(0, 8)}`,
        senderId: complaint.adminId,
        senderName: complaint.adminName,
        senderRole: "admin",
        message: index % 2 === 0
          ? "I've inspected the location you mentioned. Could you provide any additional details about when this issue first started?"
          : "Our maintenance team has been notified. Can you confirm if this is still an ongoing issue?",
        timestamp: msg3Time.toISOString(),
        isRead: true,
      });
      
      const msg4Time = new Date(msg3Time.getTime() + 1200000); // 20 min later
      chatMessages.push({
        id: `${complaint.id}-msg-4`,
        chatroomId: complaint.chatroomId || `ROOM-${complaint.id.substring(0, 8)}`,
        senderId: complaint.userId,
        senderName: complaint.username,
        senderRole: "student",
        message: index % 2 === 0
          ? "Yes, I noticed it started about a week ago. It's been getting progressively worse since then."
          : "Yes, I checked this morning and the issue is still there. It needs immediate attention.",
        timestamp: msg4Time.toISOString(),
        isRead: true,
      });
      
      // Status update from admin
      if (complaint.status === "InProgress" || complaint.status === "Resolved") {
        const msg5Time = new Date(msg4Time.getTime() + 3600000); // 1 hour later
        chatMessages.push({
          id: `${complaint.id}-msg-5`,
          chatroomId: complaint.chatroomId || `ROOM-${complaint.id.substring(0, 8)}`,
          senderId: complaint.adminId,
          senderName: complaint.adminName,
          senderRole: "admin",
          message: complaint.status === "Resolved"
            ? "Good news! The issue has been resolved. Our team has completed the necessary repairs/actions. Please verify and let me know if everything is satisfactory."
            : "We're currently working on this issue. I'll keep you updated on the progress. Expected completion within 24-48 hours.",
          timestamp: msg5Time.toISOString(),
          isRead: complaint.status === "Resolved",
        });
      }
      
      // Final response from student (only for resolved cases)
      if (complaint.status === "Resolved") {
        const msg6Time = new Date(chatMessages[chatMessages.length - 1].timestamp);
        msg6Time.setTime(msg6Time.getTime() + 1800000); // 30 min later
        chatMessages.push({
          id: `${complaint.id}-msg-6`,
          chatroomId: complaint.chatroomId || `ROOM-${complaint.id.substring(0, 8)}`,
          senderId: complaint.userId,
          senderName: complaint.username,
          senderRole: "student",
          message: index % 2 === 0
            ? "Thank you so much! I can confirm that the issue has been fixed. Really appreciate your quick response."
            : "Perfect! Everything looks good now. Thanks for handling this so efficiently.",
          timestamp: msg6Time.toISOString(),
          isRead: true,
        });
      }
    }
    
    // Add chat messages to complaint object
    complaint.chatMessages = chatMessages;
  });
};

addChatDataToLatestComplaints();

export default MOCK_COMPLAINTS;
