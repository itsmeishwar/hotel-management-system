const { Housekeeping, Room, User, Reservation } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class HousekeepingController {
  // Get all housekeeping tasks with pagination and filtering
  async getTasks(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        taskType,
        priority,
        assignedTo,
        roomId,
        date,
        sortBy = 'scheduledDate',
        sortOrder = 'asc'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      if (taskType) {
        whereClause.taskType = taskType;
      }
      
      if (priority) {
        whereClause.priority = priority;
      }
      
      if (assignedTo) {
        whereClause.assignedTo = assignedTo;
      }
      
      if (roomId) {
        whereClause.roomId = roomId;
      }
      
      if (date) {
        whereClause.scheduledDate = date;
      }
      
      // Get tasks
      const { count, rows: tasks } = await Housekeeping.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType', 'floor']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Reservation,
            as: 'reservation',
            attributes: ['id', 'checkInDate', 'checkOutDate'],
            include: [
              {
                model: require('../models').Guest,
                as: 'guest',
                attributes: ['firstName', 'lastName']
              }
            ]
          }
        ]
      });
      
      res.json({
        success: true,
        data: {
          tasks,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get housekeeping tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching housekeeping tasks'
      });
    }
  }
  
  // Get task by ID
  async getTaskById(req, res) {
    try {
      const { id } = req.params;
      
      const task = await Housekeeping.findByPk(id, {
        include: [
          {
            model: Room,
            as: 'room'
          },
          {
            model: User,
            as: 'assignee'
          },
          {
            model: User,
            as: 'creator'
          },
          {
            model: User,
            as: 'completer'
          },
          {
            model: User,
            as: 'inspector'
          },
          {
            model: Reservation,
            as: 'reservation',
            include: [
              {
                model: require('../models').Guest,
                as: 'guest'
              }
            ]
          }
        ]
      });
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Housekeeping task not found'
        });
      }
      
      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('Get housekeeping task by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching housekeeping task'
      });
    }
  }
  
  // Create new housekeeping task
  async createTask(req, res) {
    try {
      const taskData = req.body;
      
      // Add system fields
      taskData.createdBy = req.user.id;
      
      // Create task
      const task = await Housekeeping.create(taskData);
      
      // Fetch complete task with associations
      const createdTask = await Housekeeping.findByPk(task.id, {
        include: [
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType', 'floor']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });
      
      res.status(201).json({
        success: true,
        message: 'Housekeeping task created successfully',
        data: createdTask
      });
    } catch (error) {
      console.error('Create housekeeping task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating housekeeping task'
      });
    }
  }
  
  // Update housekeeping task
  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const task = await Housekeeping.findByPk(id);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Housekeeping task not found'
        });
      }
      
      // Validate status transitions
      const validTransitions = {
        'pending': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'paused'],
        'paused': ['in_progress', 'cancelled'],
        'completed': ['verified'],
        'verified': [],
        'cancelled': []
      };
      
      if (updateData.status && !validTransitions[task.status].includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${task.status} to ${updateData.status}`
        });
      }
      
      // Add completion data
      if (updateData.status === 'completed') {
        updateData.endTime = new Date();
        updateData.completedBy = req.user.id;
        updateData.duration = moment(updateData.endTime).diff(moment(task.startTime || task.createdAt), 'minutes');
      }
      
      if (updateData.status === 'in_progress' && task.status !== 'in_progress') {
        updateData.startTime = new Date();
      }
      
      // Update task
      await task.update(updateData);
      
      // Fetch updated task with associations
      const updatedTask = await Housekeeping.findByPk(id, {
        include: [
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType', 'floor']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });
      
      res.json({
        success: true,
        message: 'Housekeeping task updated successfully',
        data: updatedTask
      });
    } catch (error) {
      console.error('Update housekeeping task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating housekeeping task'
      });
    }
  }
  
  // Delete housekeeping task
  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      
      const task = await Housekeeping.findByPk(id);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Housekeeping task not found'
        });
      }
      
      // Check if task can be deleted
      if (['completed', 'verified'].includes(task.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete completed or verified tasks'
        });
      }
      
      // Update status to cancelled instead of deleting
      await task.update({ status: 'cancelled' });
      
      res.json({
        success: true,
        message: 'Housekeeping task cancelled successfully'
      });
    } catch (error) {
      console.error('Delete housekeeping task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while cancelling housekeeping task'
      });
    }
  }
  
  // Get housekeeping dashboard
  async getDashboard(req, res) {
    try {
      const today = moment().format('YYYY-MM-DD');
      
      // Today's tasks by status
      const todayTasksByStatus = await Housekeeping.findAll({
        where: { scheduledDate: today },
        attributes: [
          'status',
          [Housekeeping.sequelize.fn('COUNT', Housekeeping.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      // Pending tasks by priority
      const pendingTasksByPriority = await Housekeeping.findAll({
        where: { status: 'pending' },
        attributes: [
          'priority',
          [Housekeeping.sequelize.fn('COUNT', Housekeeping.sequelize.col('id')), 'count']
        ],
        group: ['priority']
      });
      
      // Overdue tasks
      const overdueTasks = await Housekeeping.findAll({
        where: {
          scheduledDate: { [Op.lt]: today },
          status: ['pending', 'in_progress', 'paused']
        },
        include: [
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType']
          }
        ],
        order: [['scheduledDate', 'ASC']],
        limit: 20
      });
      
      // Today's high priority tasks
      const todayHighPriorityTasks = await Housekeeping.findAll({
        where: {
          scheduledDate: today,
          priority: ['high', 'urgent'],
          status: ['pending', 'in_progress']
        },
        include: [
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['priority', 'DESC'], ['scheduledDate', 'ASC']],
        limit: 20
      });
      
      // Staff performance (tasks completed today)
      const staffPerformance = await Housekeeping.findAll({
        where: {
          completedBy: { [Op.ne]: null },
          endTime: { [Op.gte]: moment().startOf('day').toDate() }
        },
        attributes: [
          'completedBy',
          [Housekeeping.sequelize.fn('COUNT', Housekeeping.sequelize.col('id')), 'tasksCompleted'],
          [Housekeeping.sequelize.fn('AVG', Housekeeping.sequelize.col('duration')), 'avgDuration']
        ],
        include: [
          {
            model: User,
            as: 'completer',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        group: ['completedBy', 'completer.id']
      });
      
      // Room cleanliness status
      const roomCleanlinessStatus = await Room.findAll({
        where: { isActive: true },
        attributes: [
          'housekeepingStatus',
          [Room.sequelize.fn('COUNT', Room.sequelize.col('id')), 'count']
        ],
        group: ['housekeepingStatus']
      });
      
      // Upcoming tasks (next 3 days)
      const upcomingTasks = await Housekeeping.findAll({
        where: {
          scheduledDate: {
            [Op.between]: [
              today,
              moment().add(3, 'days').format('YYYY-MM-DD')
            ]
          },
          status: 'pending'
        },
        include: [
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType']
          }
        ],
        order: [['scheduledDate', 'ASC']],
        limit: 20
      });
      
      res.json({
        success: true,
        data: {
          todayTasksByStatus,
          pendingTasksByPriority,
          overdueTasks,
          todayHighPriorityTasks,
          staffPerformance,
          roomCleanlinessStatus,
          upcomingTasks
        }
      });
    } catch (error) {
      console.error('Get housekeeping dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching housekeeping dashboard'
      });
    }
  }
  
  // Assign tasks to staff
  async assignTasks(req, res) {
    try {
      const { taskIds, userId } = req.body;
      
      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Task IDs array is required'
        });
      }
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      // Verify user exists and has housekeeping role
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (!['housekeeping', 'admin', 'management'].includes(user.role)) {
        return res.status(400).json({
          success: false,
          message: 'User does not have housekeeping permissions'
        });
      }
      
      // Update tasks
      const updatedTasks = await Housekeeping.update(
        { assignedTo: userId },
        {
          where: {
            id: taskIds,
            status: 'pending'
          },
          returning: true
        }
      );
      
      res.json({
        success: true,
        message: `Successfully assigned ${updatedTasks[1]} tasks to ${user.firstName} ${user.lastName}`,
        data: {
          assignedCount: updatedTasks[1],
          userId
        }
      });
    } catch (error) {
      console.error('Assign tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while assigning tasks'
      });
    }
  }
  
  // Inspect completed task
  async inspectTask(req, res) {
    try {
      const { id } = req.params;
      const { qualityScore, notes, issues } = req.body;
      
      const task = await Housekeeping.findByPk(id);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Housekeeping task not found'
        });
      }
      
      if (task.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Only completed tasks can be inspected'
        });
      }
      
      // Update task with inspection results
      const updateData = {
        status: 'verified',
        inspectedBy: req.user.id,
        inspectionDate: new Date(),
        inspectionNotes: notes
      };
      
      if (qualityScore !== undefined) {
        updateData.qualityScore = qualityScore;
      }
      
      if (issues && Array.isArray(issues)) {
        updateData.issues = issues;
      }
      
      await task.update(updateData);
      
      // Update room status if this was a turnover or cleaning task
      if (['turnover', 'cleaning'].includes(task.taskType)) {
        const roomStatus = issues && issues.length > 0 ? 'maintenance' : 'available';
        const housekeepingStatus = issues && issues.length > 0 ? 'dirty' : 'clean';
        
        await Room.update(
          { 
            status: roomStatus,
            housekeepingStatus
          },
          { where: { id: task.roomId } }
        );
      }
      
      res.json({
        success: true,
        message: 'Task inspected successfully',
        data: {
          taskId: id,
          status: task.status,
          qualityScore: task.qualityScore
        }
      });
    } catch (error) {
      console.error('Inspect task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while inspecting task'
      });
    }
  }
  
  // Get tasks for specific staff member
  async getMyTasks(req, res) {
    try {
      const userId = req.user.id;
      const { status, date } = req.query;
      
      const whereClause = { assignedTo: userId };
      
      if (status) {
        whereClause.status = status;
      }
      
      if (date) {
        whereClause.scheduledDate = date;
      }
      
      const tasks = await Housekeeping.findAll({
        where: whereClause,
        include: [
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType', 'floor']
          },
          {
            model: Reservation,
            as: 'reservation',
            attributes: ['id', 'checkInDate', 'checkOutDate'],
            include: [
              {
                model: require('../models').Guest,
                as: 'guest',
                attributes: ['firstName', 'lastName']
              }
            ]
          }
        ],
        order: [['scheduledDate', 'ASC'], [['priority', 'DESC']]]
      });
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Get my tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching your tasks'
      });
    }
  }
  
  // Generate housekeeping report
  async generateReport(req, res) {
    try {
      const { startDate, endDate, userId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }
      
      // Build where clause
      const whereClause = {
        scheduledDate: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (userId) {
        whereClause.assignedTo = userId;
      }
      
      // Get report data
      const reportData = await Housekeeping.findAll({
        where: whereClause,
        include: [
          {
            model: Room,
            as: 'room',
            attributes: ['roomNumber', 'roomType']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['firstName', 'lastName']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['firstName', 'lastName']
          }
        ],
        order: [['scheduledDate', 'ASC']]
      });
      
      // Calculate statistics
      const totalTasks = reportData.length;
      const completedTasks = reportData.filter(t => t.status === 'completed' || t.status === 'verified').length;
      const pendingTasks = reportData.filter(t => t.status === 'pending').length;
      const inProgressTasks = reportData.filter(t => t.status === 'in_progress').length;
      
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;
      
      // Average duration for completed tasks
      const completedTasksWithDuration = reportData.filter(t => t.duration && t.status !== 'cancelled');
      const avgDuration = completedTasksWithDuration.length > 0
        ? (completedTasksWithDuration.reduce((sum, t) => sum + t.duration, 0) / completedTasksWithDuration.length).toFixed(2)
        : 0;
      
      // Average quality score
      const inspectedTasks = reportData.filter(t => t.qualityScore !== null);
      const avgQualityScore = inspectedTasks.length > 0
        ? (inspectedTasks.reduce((sum, t) => sum + t.qualityScore, 0) / inspectedTasks.length).toFixed(2)
        : 0;
      
      res.json({
        success: true,
        data: {
          summary: {
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            completionRate: parseFloat(completionRate),
            avgDuration: parseFloat(avgDuration),
            avgQualityScore: parseFloat(avgQualityScore)
          },
          tasks: reportData,
          period: {
            startDate,
            endDate
          }
        }
      });
    } catch (error) {
      console.error('Generate housekeeping report error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while generating housekeeping report'
      });
    }
  }
}

module.exports = new HousekeepingController();