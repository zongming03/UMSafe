import FacultyModel from "../models/Room.js";

const FacultyCS = new FacultyModel({
  name: "Faculty of Computer Science and Information Technology (FSKTM)",
  faculty_blocks: [
    {
      name: "Block A",
      faculty_block_rooms: [
        { name: "MM1 Lab", latitude: 3.128244, longitude: 101.650775 },
        { name: "MM3 Lab", latitude: 3.128377, longitude: 101.650647 },
        { name: "Robotic Lab", latitude: 3.128343, longitude: 101.650542 },
        { name: "CCNA Lab", latitude: 3.128376, longitude: 101.65056 },
        { name: "BK1", latitude: 3.128204, longitude: 101.650476 },
        { name: "BK2", latitude: 3.128095, longitude: 101.650699 },
        { name: "Foyer A", latitude: 3.12824, longitude: 101.650615 },
        { name: "The Cube", latitude: 3.128206, longitude: 101.65075 },
        { name: "ML Lab", latitude: 3.128342, longitude: 101.650707 },
        { name: "A Floor 1 Area", latitude: 3.128126, longitude: 101.650573 },
        { name: "A Floor 2 Area", latitude: 3.128126, longitude: 101.650573 },
        { name: "A Floor 3 Area", latitude: 3.128126, longitude: 101.650573 },
        { name: "Postgraduate Lounge", latitude: 3.12823, longitude: 101.650502 },
      ],
    },
    {
      name: "Block B",
      faculty_block_rooms: [
        { name: "MM2", latitude: 3.128605, longitude: 101.650092 },
        { name: "MM4", latitude: 3.128628, longitude: 101.65002 },
        { name: "MM5", latitude: 3.128584, longitude: 101.650075 },
        { name: "MM6", latitude: 3.128486, longitude: 101.65027 },
        { name: "Foyer B", latitude: 3.128312, longitude: 101.650117 },
        { name: "B Floor 1 Area", latitude: 3.128313, longitude: 101.650112 },
        { name: "B Floor 2 Area", latitude: 3.128313, longitude: 101.650112 },
        { name: "B Floor 3 Area", latitude: 3.128313, longitude: 101.650112 },
        { name: "Student Lounge", latitude: 3.128458, longitude: 101.650134 },
        { name: "DK1", latitude: 3.128396, longitude: 101.64986 },
        { name: "DK2", latitude: 3.128566, longitude: 101.649916 },
      ],
    },
  ],
});

export default FacultyCS;
