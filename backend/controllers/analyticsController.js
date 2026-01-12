// Mock data based on partner's API structure
const MOCK_REPORTS = [
  {
    id: "01979b34-7c61-7068-8a3f-8160766b425a",
    userId: "testing",
    adminId: "Unassigned",
    status: "opened",
    title: "Classroom cleanliness issue",
    description: "Trash not cleared properly",
    category: { name: "Cleanliness", priority: "Low" },
    media: [],
    latitude: 3.1271268,
    longitude: 101.6349605,
    facultyLocation: {
      faculty: "Faculty of Computer Science and Engineering",
      facultyBlock: "Block A",
      facultyBlockRoom: "Room 101"
    },
    isAnonymous: false,
    chatroomId: "",
    createdAt: "2025-01-15T10:30:00.000Z",
    updatedAt: "2025-01-15T10:30:00.000Z",
    version: 1
  },
  {
    id: "01979b34-8d72-8179-9b4f-9271877c536b",
    userId: "user123",
    adminId: "admin001",
    status: "inprogress",
    title: "Bullying incident reported",
    description: "Student reported being bullied",
    category: { name: "Bullying", priority: "High" },
    media: [],
    latitude: 3.1271268,
    longitude: 101.6349605,
    facultyLocation: {
      faculty: "Faculty of Business and Economics",
      facultyBlock: "Block B",
      facultyBlockRoom: "Room 201"
    },
    isAnonymous: true,
    chatroomId: "chat123",
    createdAt: "2025-01-20T14:20:00.000Z",
    updatedAt: "2025-01-21T09:15:00.000Z",
    version: 2
  },
  {
    id: "01979b34-9e83-9280-ac5g-a382988d647c",
    userId: "user456",
    adminId: "admin002",
    status: "resolved",
    title: "Broken chair in lecture hall",
    description: "Chair needs repair",
    category: { name: "Vandalism", priority: "Medium" },
    media: [],
    latitude: 3.1271268,
    longitude: 101.6349605,
    facultyLocation: {
      faculty: "Faculty of Engineering",
      facultyBlock: "Block C",
      facultyBlockRoom: "Room 301"
    },
    isAnonymous: false,
    chatroomId: "chat456",
    createdAt: "2025-02-10T08:45:00.000Z",
    updatedAt: "2025-02-12T16:30:00.000Z",
    version: 3
  },
  {
    id: "01979b34-af94-a391-bd6h-b493a99e758d",
    userId: "user789",
    adminId: "Unassigned",
    status: "opened",
    title: "Academic misconduct suspected",
    description: "Plagiarism case needs review",
    category: { name: "Academic Misconduct", priority: "High" },
    media: [],
    latitude: 3.1271268,
    longitude: 101.6349605,
    facultyLocation: {
      faculty: "Faculty of Law",
      facultyBlock: "Block D",
      facultyBlockRoom: "Room 401"
    },
    isAnonymous: false,
    chatroomId: "",
    createdAt: "2025-02-18T11:00:00.000Z",
    updatedAt: "2025-02-18T11:00:00.000Z",
    version: 1
  },
  {
    id: "01979b34-bfa5-b4a2-ce7i-c5a4baaف869e",
    userId: "user321",
    adminId: "admin003",
    status: "resolved",
    title: "Toilet hygiene poor",
    description: "Needs immediate cleaning",
    category: { name: "Cleanliness", priority: "Low" },
    media: [],
    latitude: 3.1271268,
    longitude: 101.6349605,
    facultyLocation: {
      faculty: "Faculty of Computer Science and Engineering",
      facultyBlock: "Block A",
      facultyBlockRoom: "Room 105"
    },
    isAnonymous: false,
    chatroomId: "chat789",
    createdAt: "2025-03-05T13:10:00.000Z",
    updatedAt: "2025-03-06T10:20:00.000Z",
    version: 2
  },
  {
    id: "01979b34-cfb6-c5b3-df8j-d6b5cbbg970f",
    userId: "user654",
    adminId: "Unassigned",
    status: "opened",
    title: "Dress code violation",
    description: "Inappropriate attire observed",
    category: { name: "Dress Code", priority: "Medium" },
    media: [],
    latitude: 3.1271268,
    longitude: 101.6349605,
    facultyLocation: {
      faculty: "Faculty of Business and Economics",
      facultyBlock: "Block E",
      facultyBlockRoom: "Room 501"
    },
    isAnonymous: true,
    chatroomId: "",
    createdAt: "2025-03-12T09:25:00.000Z",
    updatedAt: "2025-03-12T09:25:00.000Z",
    version: 1
  },
  {
    id: "01979b34-dfc7-d6c4-eg9k-e7c6dcch081g",
    userId: "user987",
    adminId: "admin001",
    status: "inprogress",
    title: "Bullying in cafeteria",
    description: "Multiple students involved",
    category: { name: "Bullying", priority: "High" },
    media: [],
    latitude: 3.1271268,
    longitude: 101.6349605,
    facultyLocation: {
      faculty: "Faculty of Engineering",
      facultyBlock: "Block F",
      facultyBlockRoom: "Cafeteria"
    },
    isAnonymous: false,
    chatroomId: "chat321",
    createdAt: "2025-03-18T15:40:00.000Z",
    updatedAt: "2025-03-19T08:30:00.000Z",
    version: 2
  }
];

// Helper function to fetch reports (will be replaced with actual API call later)
async function fetchReportsData() {
  // TODO: Replace with actual API call to partner's endpoint
  // Example: const response = await axios.get('PARTNER_API_URL/reports');
  // return response.data.reports;
  
  return MOCK_REPORTS;
}

// GET /api/analytics/summary
export async function getComplaintSummary(req, res) {
  try {
    const reports = await fetchReportsData();
    
    const total = reports.length;
    const resolved = reports.filter(r => r.status.toLowerCase() === 'resolved').length;
    const opened = reports.filter(r => r.status.toLowerCase() === 'opened').length;
    const inProgress = reports.filter(r => r.status.toLowerCase() === 'inprogress').length;
    const highPriority = reports.filter(r => r.category.priority === 'High').length;

    res.json({ 
      total, 
      resolved, 
      opened,
      inProgress,
      highPriority
    });
  } catch (err) {
    console.error('Error in getComplaintSummary:', err);
    res.status(500).json({ msg: 'Failed to load summary data' });
  }
}

// GET /api/analytics/categories
export async function getComplaintTypeChart(req, res) {
  try {
    const reports = await fetchReportsData();
    
    // Group by category name
    const categoryCount = {};
    reports.forEach(report => {
      const categoryName = report.category.name;
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    });
    
    // Convert to array format for charts
    const breakdown = Object.keys(categoryCount).map(name => ({
      _id: name,
      count: categoryCount[name]
    }));
    
    res.json(breakdown);
  } catch (err) {
    console.error('Error in getComplaintTypeChart:', err);
    res.status(500).json({ msg: 'Failed to load category chart' });
  }
}

// GET /api/analytics/trend
export async function getComplaintTrends(req, res) {
  try {
    const reports = await fetchReportsData();
    
    // Group by date
    const dateCount = {};
    reports.forEach(report => {
      const date = new Date(report.createdAt).toISOString().split('T')[0];
      dateCount[date] = (dateCount[date] || 0) + 1;
    });
    
    // Convert to array and sort by date
    const trends = Object.keys(dateCount)
      .sort()
      .map(date => ({
        _id: date,
        count: dateCount[date]
      }));
    
    res.json(trends);
  } catch (err) {
    console.error('Error in getComplaintTrends:', err);
    res.status(500).json({ msg: 'Failed to load trends' });
  }
}

// Get category trend comparison
export async function getCategoryTrendComparison(req, res) {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ msg: 'startDate and endDate are required' });
    }

    const Complaint = require('../models/Complaint');
    
    // Parse dates
    const selectedStart = new Date(startDate);
    const selectedEnd = new Date(endDate);
    
    // Calculate the duration (in milliseconds)
    const duration = selectedEnd.getTime() - selectedStart.getTime();
    
    // Calculate previous period dates
    const previousStart = new Date(selectedStart.getTime() - duration);
    const previousEnd = new Date(selectedStart.getTime());
    
    // MongoDB aggregation pipeline
    const result = await Complaint.aggregate([
      {
        $facet: {
          currentPeriod: [
            {
              $match: {
                createdAt: {
                  $gte: selectedStart,
                  $lte: selectedEnd
                }
              }
            },
            {
              $group: {
                _id: {
                  $cond: [
                    { $eq: [{ $type: '$category' }, 'object'] },
                    '$category.name',
                    '$category'
                  ]
                },
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                category: '$_id',
                currentCount: '$count',
                _id: 0
              }
            }
          ],
          previousPeriod: [
            {
              $match: {
                createdAt: {
                  $gte: previousStart,
                  $lt: previousEnd
                }
              }
            },
            {
              $group: {
                _id: {
                  $cond: [
                    { $eq: [{ $type: '$category' }, 'object'] },
                    '$category.name',
                    '$category'
                  ]
                },
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                category: '$_id',
                previousCount: '$count',
                _id: 0
              }
            }
          ]
        }
      },
      {
        $project: {
          merged: {
            $map: {
              input: '$currentPeriod',
              as: 'current',
              in: {
                category: '$$current.category',
                currentCount: '$$current.currentCount',
                previousCount: {
                  $let: {
                    vars: {
                      prevItem: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$previousPeriod',
                              as: 'prev',
                              cond: { $eq: ['$$prev.category', '$$current.category'] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: { $ifNull: ['$$prevItem.previousCount', 0] }
                  }
                }
              }
            }
          }
        }
      },
      {
        $unwind: '$merged'
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$merged',
              {
                difference: { $subtract: ['$merged.currentCount', '$merged.previousCount'] },
                percentageChange: {
                  $cond: [
                    { $eq: ['$merged.previousCount', 0] },
                    null,
                    {
                      $multiply: [
                        {
                          $divide: [
                            { $subtract: ['$merged.currentCount', '$merged.previousCount'] },
                            '$merged.previousCount'
                          ]
                        },
                        100
                      ]
                    }
                  ]
                }
              }
            ]
          }
        }
      },
      {
        $sort: { difference: -1 }
      }
    ]);

    res.json({ data: result });
  } catch (err) {
    console.error('Error in getCategoryTrendComparison:', err);
    res.status(500).json({ msg: 'Failed to load category trend data' });
  }
}
