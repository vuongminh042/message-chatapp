import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Tạo nhóm chat mới
export const createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate, maxMembers, memberIds } = req.body;
    const adminId = req.user._id;

    // Validate tên nhóm
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Tên nhóm không được để trống" });
    }

    // Validate members
    let members = [{ user: adminId, role: "admin" }];
    
    if (memberIds && memberIds.length > 0) {
      // Validate member IDs
      const validMembers = await User.find({ _id: { $in: memberIds } });
      if (validMembers.length !== memberIds.length) {
        return res.status(400).json({ error: "Một số thành viên không tồn tại" });
      }

      // Thêm members (loại bỏ admin nếu có trong danh sách)
      const uniqueMemberIds = memberIds.filter(id => id !== adminId.toString());
      const additionalMembers = uniqueMemberIds.map(memberId => ({
        user: memberId,
        role: "member"
      }));
      members = [...members, ...additionalMembers];
    }

    // Validate maxMembers
    const finalMaxMembers = maxMembers || 100;
    if (members.length > finalMaxMembers) {
      return res.status(400).json({ 
        error: `Nhóm chỉ có thể có tối đa ${finalMaxMembers} thành viên` 
      });
    }

    const newGroup = new Group({
      name: name.trim(),
      description: description || "",
      admin: adminId,
      members,
      isPrivate: isPrivate || false,
      maxMembers: finalMaxMembers
    });

    await newGroup.save();

    // Populate thông tin admin và members
    await newGroup.populate([
      { path: 'admin', select: 'fullName email profilePic' },
      { path: 'members.user', select: 'fullName email profilePic' }
    ]);

    // Thông báo cho các thành viên về nhóm mới
    members.forEach(member => {
      if (member.user.toString() !== adminId.toString()) {
        const memberSocketId = getReceiverSocketId(member.user.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("addedToGroup", newGroup);
        }
      }
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error in createGroup: ", error.message);
    res.status(500).json({ error: "Không thể tạo nhóm. Vui lòng thử lại." });
  }
};

// Lấy danh sách nhóm của user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      "members.user": userId
    })
      .populate([
        { path: 'admin', select: 'fullName email profilePic' },
        { path: 'members.user', select: 'fullName email profilePic' },
        { path: 'lastMessage' }
      ])
      .sort({ lastActivity: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getUserGroups: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

// Lấy thông tin chi tiết nhóm
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate([
        { path: 'admin', select: 'fullName email profilePic' },
        { path: 'members.user', select: 'fullName email profilePic' }
      ]);

    if (!group) {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    // Kiểm tra user có phải thành viên của nhóm không
    const isMember = group.members.some(member => 
      member.user._id.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "Bạn không phải thành viên của nhóm này" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupDetails: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

// Gửi tin nhắn trong nhóm
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, video, replyTo } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    // Kiểm tra nhóm có tồn tại không
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    // Kiểm tra user có phải thành viên của nhóm không
    const isMember = group.members.some(member => 
      member.user.toString() === senderId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "Bạn không phải thành viên của nhóm này" });
    }

    let imageUrl;
    let videoUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    if (video) {
      try {
        const base64Size = video.length * 0.75;
        const videoSize = base64Size - (video.split(',')[0].length + 1);
        const maxSize = 1024 * 1024 * 1024; 

        if (videoSize > maxSize) {
          return res.status(400).json({
            error: "Kích thước video không được vượt quá 1GB"
          });
        }

        const uploadResponse = await cloudinary.uploader.upload(video, {
          resource_type: "video",
          chunk_size: 20000000,
          eager: [
            { 
              format: "mp4",
              transformation: [
                { width: 380, crop: "scale" },
                { quality: "auto:eco" }
              ]
            }
          ],
          eager_async: true,
          allowed_formats: ["mp4", "mov", "avi", "mkv"],
          max_file_size: 1024000000 
        });
        videoUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Error uploading video:", uploadError);
        return res.status(400).json({ 
          error: "Không thể tải lên video. Video phải có định dạng MP4, MOV, AVI hoặc MKV và dung lượng dưới 1GB." 
        });
      }
    }
    
    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: imageUrl,
      video: videoUrl,
      replyTo: replyTo || null,
      messageType: "group"
    });

    await newMessage.save();

    if(replyTo) {
      await newMessage.populate('replyTo');
    }

    await newMessage.populate('senderId', 'fullName profilePic');

    // Cập nhật lastMessage và lastActivity của nhóm
    group.lastMessage = newMessage._id;
    group.lastActivity = new Date();
    await group.save();

    // Gửi tin nhắn cho tất cả thành viên trong nhóm (trừ người gửi)
    group.members.forEach(member => {
      if (member.user.toString() !== senderId.toString()) {
        const memberSocketId = getReceiverSocketId(member.user.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("newGroupMessage", newMessage);
        }
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error);
    res.status(500).json({ error: "Không thể gửi tin nhắn. Vui lòng thử lại." });
  }
};

// Lấy tin nhắn trong nhóm
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Kiểm tra nhóm có tồn tại không
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    // Kiểm tra user có phải thành viên của nhóm không
    const isMember = group.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "Bạn không phải thành viên của nhóm này" });
    }

    const messages = await Message.find({ groupId })
      .populate('senderId', 'fullName profilePic')
      .populate('replyTo')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

// Thêm thành viên vào nhóm
export const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    // Kiểm tra quyền (chỉ admin và moderator mới có thể thêm thành viên)
    const requesterMember = group.members.find(member => 
      member.user.toString() === requesterId.toString()
    );

    if (!requesterMember || (requesterMember.role !== "admin" && requesterMember.role !== "moderator")) {
      return res.status(403).json({ error: "Bạn không có quyền thêm thành viên" });
    }

    // Validate userIds
    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ error: "Vui lòng chọn ít nhất một thành viên" });
    }

    const usersToAdd = await User.find({ _id: { $in: userIds } });
    if (usersToAdd.length !== userIds.length) {
      return res.status(400).json({ error: "Một số thành viên không tồn tại" });
    }

    // Kiểm tra số lượng thành viên tối đa
    const currentMemberCount = group.members.length;
    const newMemberCount = currentMemberCount + userIds.length;
    
    if (newMemberCount > group.maxMembers) {
      return res.status(400).json({ 
        error: `Nhóm chỉ có thể có tối đa ${group.maxMembers} thành viên` 
      });
    }

    // Thêm các thành viên mới (loại bỏ những người đã là thành viên)
    const existingMemberIds = group.members.map(member => member.user.toString());
    const newMemberIds = userIds.filter(userId => !existingMemberIds.includes(userId));

    if (newMemberIds.length === 0) {
      return res.status(400).json({ error: "Tất cả người dùng đã là thành viên của nhóm" });
    }

    const newMembers = newMemberIds.map(userId => ({
      user: userId,
      role: "member",
      joinedAt: new Date()
    }));

    group.members.push(...newMembers);
    await group.save();

    await group.populate([
      { path: 'admin', select: 'fullName email profilePic' },
      { path: 'members.user', select: 'fullName email profilePic' }
    ]);

    // Thông báo cho các thành viên mới
    newMemberIds.forEach(memberId => {
      const memberSocketId = getReceiverSocketId(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("addedToGroup", group);
      }
    });

    // Thông báo cho các thành viên cũ
    existingMemberIds.forEach(memberId => {
      if (memberId !== requesterId.toString()) {
        const memberSocketId = getReceiverSocketId(memberId);
        if (memberSocketId) {
          io.to(memberSocketId).emit("groupMembersAdded", {
            groupId,
            newMembers: newMembers
          });
        }
      }
    });

    res.status(200).json({ 
      message: "Thêm thành viên thành công", 
      group 
    });
  } catch (error) {
    console.error("Error in addMemberToGroup: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

// Rời khỏi nhóm
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    // Kiểm tra user có phải thành viên của nhóm không
    const memberIndex = group.members.findIndex(member => 
      member.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: "Bạn không phải thành viên của nhóm này" });
    }

    // Nếu user là admin và còn thành viên khác, cần chuyển quyền admin
    if (group.admin.toString() === userId.toString() && group.members.length > 1) {
      // Tìm thành viên có vai trò cao nhất để làm admin mới
      const newAdmin = group.members.find(member => 
        member.user.toString() !== userId.toString() && 
        (member.role === "moderator" || member.role === "admin")
      ) || group.members.find(member => 
        member.user.toString() !== userId.toString()
      );

      if (newAdmin) {
        group.admin = newAdmin.user;
        newAdmin.role = "admin";
      }
    }

    // Xóa thành viên khỏi nhóm
    group.members.splice(memberIndex, 1);

    // Nếu không còn thành viên nào, xóa nhóm
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ message: "Đã rời khỏi nhóm và xóa nhóm" });
    }

    await group.save();

    // Thông báo cho các thành viên còn lại
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.user.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit("memberLeftGroup", {
          groupId,
          userId,
          newAdmin: group.admin
        });
      }
    });

    res.status(200).json({ message: "Đã rời khỏi nhóm thành công" });
  } catch (error) {
    console.error("Error in leaveGroup: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

// Xóa thành viên khỏi nhóm (chỉ admin)
export const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    // Kiểm tra quyền (chỉ admin mới có thể xóa thành viên)
    if (group.admin.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: "Chỉ admin mới có thể xóa thành viên" });
    }

    // Không thể xóa chính mình
    if (userId === requesterId.toString()) {
      return res.status(400).json({ error: "Không thể xóa chính mình. Sử dụng tính năng rời nhóm." });
    }

    // Tìm và xóa thành viên
    const memberIndex = group.members.findIndex(member => 
      member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: "Thành viên không tồn tại trong nhóm" });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    // Thông báo cho thành viên bị xóa
    const removedMemberSocketId = getReceiverSocketId(userId);
    if (removedMemberSocketId) {
      io.to(removedMemberSocketId).emit("removedFromGroup", {
        groupId,
        groupName: group.name
      });
    }

    // Thông báo cho các thành viên còn lại
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.user.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit("memberRemovedFromGroup", {
          groupId,
          removedUserId: userId
        });
      }
    });

    res.status(200).json({ message: "Xóa thành viên thành công" });
  } catch (error) {
    console.error("Error in removeMemberFromGroup: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

// Cập nhật thông tin nhóm
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, profilePic } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    // Kiểm tra quyền (chỉ admin và moderator mới có thể cập nhật)
    const userMember = group.members.find(member => 
      member.user.toString() === userId.toString()
    );

    if (!userMember || (userMember.role !== "admin" && userMember.role !== "moderator")) {
      return res.status(403).json({ error: "Bạn không có quyền cập nhật thông tin nhóm" });
    }

    // Cập nhật thông tin
    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description;
    if (profilePic) {
      if (profilePic.startsWith("data:")) {
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        group.profilePic = uploadResponse.secure_url;
      } else {
        group.profilePic = profilePic;
      }
    }

    await group.save();

    await group.populate([
      { path: 'admin', select: 'fullName email profilePic' },
      { path: 'members.user', select: 'fullName email profilePic' }
    ]);

    // Thông báo cho tất cả thành viên
    group.members.forEach(member => {
      if (member.user._id.toString() !== userId.toString()) {
        const memberSocketId = getReceiverSocketId(member.user._id.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("groupUpdated", group);
        }
      }
    });

    res.status(200).json({ message: "Cập nhật nhóm thành công", group });
  } catch (error) {
    console.error("Error in updateGroup: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

// Tìm kiếm nhóm công khai
export const searchPublicGroups = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user._id;

    if (!q) {
      return res.status(400).json({ error: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    const groups = await Group.find({
      isPrivate: false,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ],
      "members.user": { $ne: userId } // Loại bỏ nhóm user đã tham gia
    })
      .populate('admin', 'fullName profilePic')
      .select('name description profilePic admin members.length')
      .limit(20);

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in searchPublicGroups: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};

// Xin tham gia nhóm công khai
export const joinPublicGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    if (group.isPrivate) {
      return res.status(400).json({ error: "Nhóm này là riêng tư" });
    }

    // Kiểm tra đã là thành viên chưa
    const isMember = group.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (isMember) {
      return res.status(400).json({ error: "Bạn đã là thành viên của nhóm này" });
    }

    // Kiểm tra số lượng thành viên tối đa
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: "Nhóm đã đầy" });
    }

    // Thêm thành viên mới
    group.members.push({
      user: userId,
      role: "member",
      joinedAt: new Date()
    });

    await group.save();

    await group.populate([
      { path: 'admin', select: 'fullName email profilePic' },
      { path: 'members.user', select: 'fullName email profilePic' }
    ]);

    // Thông báo cho admin
    const adminSocketId = getReceiverSocketId(group.admin._id.toString());
    if (adminSocketId) {
      io.to(adminSocketId).emit("newMemberJoined", {
        groupId,
        newMember: await User.findById(userId).select('fullName profilePic')
      });
    }

    res.status(200).json({ message: "Tham gia nhóm thành công", group });
  } catch (error) {
    console.error("Error in joinPublicGroup: ", error.message);
    res.status(500).json({ error: "Đã xảy ra lỗi!!" });
  }
};