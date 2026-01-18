import axios from 'axios';
import Chat from '../models/Chat.js'; 
import User from '../models/User.js';

export const enrichAssignAdminBody = async (req) => {
  if (req.method !== 'PATCH' || !req.originalUrl.includes('/assign-admin')) return;
  try {
    if (req.body.adminId) {
      const admin = await User.findById(req.body.adminId);
      if (admin) {
        req.body.adminName = admin.name;
      }
    }
    req.body.initiatorName = req.body.initiatorName || 'Admin';
    console.log('📝 Enriched assign-admin request:', JSON.stringify(req.body, null, 2));
  } catch (err) {
    console.warn('⚠️ Failed to enrich assign-admin request:', err.message);
    if (!req.body.initiatorName) req.body.initiatorName = 'Admin';
  }
};

export const enrichRevokeAdminBody = (req) => {
  if (req.method !== 'PATCH' || !req.originalUrl.includes('/revoke-admin')) return;
  try {
    if (!req.body || typeof req.body !== 'object') {
      req.body = {};
    }
    if (!req.body.initiatorName) {
      req.body.initiatorName = 'Admin';
    }
    console.log('📝 Enriched revoke-admin request:', JSON.stringify(req.body, null, 2));
  } catch (err) {
    console.warn('⚠️ Failed to enrich revoke-admin request:', err.message);
    if (!req.body || typeof req.body !== 'object') req.body = {};
    if (!req.body.initiatorName) req.body.initiatorName = 'Admin';
  }
};

export const enrichStatusBody = (req) => {
  if (req.method !== 'PATCH') return;
  const isStatus = req.originalUrl.includes('/resolve') || req.originalUrl.includes('/close');
  if (!isStatus) return;
  
  // Ensure body is an object
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }
  
  // Add initiatorName if not already present
  if (!req.body.initiatorName) {
    req.body.initiatorName = 'Admin';
  }
  
  // For close endpoint, ensure reason is present (this is required by CloseReportInputSchema)
  if (req.originalUrl.includes('/close') && !req.body.reason) {
    req.body.reason = 'Case closed by admin';
  }
  
  console.log('📝 Enriched status update request:', JSON.stringify(req.body, null, 2));
};

export const maybeSaveChatMessage = async (req) => {
  if (!(req.method === 'POST' && req.originalUrl.includes('/chats'))) return;
  const match = req.originalUrl.match(/\/admin\/reports\/([^\/]+)\/chatrooms\/([^\/]+)/);
  if (!match || !req.body) return;
  const [, reportId, chatroomId] = match;
  try {
    console.log(`📨 Chat message payload received:`, JSON.stringify(req.body, null, 2));
    const newChat = new Chat({
      reportId,
      chatroomId,
      senderId: req.body.senderId,
      receiverId: req.body.receiverId,
      message: req.body.message,
      attachment: req.body.attachment || undefined,
    });
    await newChat.save();
    console.log(`💾 Saved chat message to MongoDB: ${reportId}/${chatroomId}`);
    
    // Emit socket event to notify all connected users about the new message
    try {
      emitChatMessage(reportId, chatroomId, {
        messageId: newChat._id,
        senderId: newChat.senderId,
        receiverId: newChat.receiverId,
        message: newChat.message,
        content: newChat.message,
        attachment: newChat.attachment,
        createdAt: newChat.createdAt,
        timestamp: newChat.createdAt,
        system: false,
      });
      console.log(`📡 Emitted chat:new-message event for ${reportId}/${chatroomId}`);
    } catch (socketErr) {
      console.warn('⚠️ Failed to emit socket event:', socketErr.message);
    }
  } catch (err) {
    console.warn('⚠️ Failed to save message to MongoDB:', err.message);
  }
};

  // === VALIDATION: Prevent chatroom creation for anonymous complaints & unassigned officers ===
  export const validateAnonymousComplaintRestriction = async (req, partnerApiBaseUrl) => {
    try {
      // Check if this is a chatroom initiation request
      if (req.originalUrl.includes('/chatrooms/initiate') && req.method === 'POST') {
        const reportIdMatch = req.originalUrl.match(/\/admin\/reports\/([^\/]+)/);
        if (reportIdMatch && reportIdMatch[1]) {
          const reportId = reportIdMatch[1];
          console.log(`🔒 Checking if report ${reportId} is anonymous and has assigned officer for chatroom creation...`);
          
          // Fetch report details from partner API to check isAnonymous flag and assigned officer
          try {
            const reportResponse = await axios.get(
              `${partnerApiBaseUrl.replace(/\/$/, '')}/reports/${reportId}`,
              {
                headers: {
                  'ngrok-skip-browser-warning': 'true',
                  Authorization: req.headers['authorization'] || '',
                },
                validateStatus: () => true,
              }
            );
            
            const reportData = reportResponse.data?.report || reportResponse.data;
            const isAnonymous = reportData?.isAnonymous === true;
            const adminId = reportData?.adminId || reportData?.assignedTo;
            
            // Check if anonymous
            if (isAnonymous) {
              console.warn(`❌ BLOCKED: Attempted to create chatroom for anonymous complaint ${reportId}`);
              return {
                blocked: true,
                statusCode: 400,
                error: 'Chatroom creation is not allowed for anonymous complaints. The student must be identified before initiating direct communication.',
              };
            }

            // Check if officer is assigned
            if (!adminId || adminId === '' || adminId === null) {
              console.warn(`❌ BLOCKED: Attempted to create chatroom for unassigned complaint ${reportId}`);
              return {
                blocked: true,
                statusCode: 400,
                error: 'Chatroom creation requires an assigned officer. Please assign an officer to this complaint first.',
              };
            }

            console.log(`✅ Report ${reportId} is not anonymous and has assigned officer - chatroom creation allowed`);
          } catch (checkErr) {
            console.warn(`⚠️ Could not verify complaint status for ${reportId}:`, checkErr.message);
            // If we can't verify, allow the request to proceed to partner API
            return { blocked: false };
          }
        }
      }
      return { blocked: false };
    } catch (err) {
      console.error('Error in validation:', err.message);
      return { blocked: false }; // Don't block if validation fails
    }
  };