const Notification = require('../../modal/Notification');
const User = require('../../modal/User');

// Tạo thông báo mới
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Tạo thông báo cho admin khi có tutor application mới
const createTutorApplicationNotification = async (application) => {
  try {
    // Lấy tất cả admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    // Lấy thông tin user gửi đơn
    const tutorUser = await User.findById(application.tutorId);
    const tutorName = tutorUser ? tutorUser.username : 'Người dùng';
    
    const notifications = adminUsers.map(admin => ({
      title: 'Đơn xin làm tutor mới',
      message: `Có đơn xin làm tutor mới từ ${tutorName}`,
      type: 'tutor_application',
      recipient: admin._id,
      relatedId: application._id,
      relatedModel: 'TutorApplication'
    }));

    await Notification.insertMany(notifications);
    return notifications;
  } catch (error) {
    console.error('Create tutor application notification error:', error);
    throw error;
  }
};

// Lấy thông báo của user
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'username image')
      .populate('relatedId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      errorCode: 0,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      errorCode: 1,
      message: 'Error retrieving notifications'
    });
  }
};

// Đánh dấu thông báo đã đọc
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      errorCode: 0,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      errorCode: 2,
      message: 'Error marking notification as read'
    });
  }
};

// Đánh dấu tất cả thông báo đã đọc
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      errorCode: 0,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      errorCode: 3,
      message: 'Error marking all notifications as read'
    });
  }
};

// Đếm số thông báo chưa đọc
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.status(200).json({
      errorCode: 0,
      message: 'Unread count retrieved successfully',
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      errorCode: 4,
      message: 'Error getting unread count'
    });
  }
};

// Xóa thông báo
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      errorCode: 0,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      errorCode: 5,
      message: 'Error deleting notification'
    });
  }
};

module.exports = {
  createNotification,
  createTutorApplicationNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification
}; 