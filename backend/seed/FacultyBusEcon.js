import FacultyModel from "../models/Room.js";

const FacultyBusiness = new FacultyModel({
  name: "Faculty of Business and Economics",
  faculty_blocks: [
    {
      name: "Block H01",
      faculty_block_rooms: [
        { name: "Makmal Komputer 4", latitude: 3.119275903, longitude: 101.6540456 },
      ],
    },
    {
      name: "Block H03",
      faculty_block_rooms: [
        { name: "Dewan Kuliah Lim Goh Tong (DK1)", latitude: 3.118820975, longitude: 101.6538832 },
        { name: "DK2", latitude: 3.118744403, longitude: 101.6540637 },
        { name: "DK3", latitude: 3.118802958, longitude: 101.6538471 },
        { name: "DK4", latitude: 3.118938085, longitude: 101.6539373 },
        { name: "DK5", latitude: 3.118618284, longitude: 101.6539148 },
        { name: "DK6", latitude: 3.118852505, longitude: 101.6538201 },
      ],
    },
    {
      name: "Block H04",
      faculty_block_rooms: [
        { name: "BSB 1", latitude: 3.118271458, longitude: 101.6535945 },
        { name: "BSB 2", latitude: 3.118266954, longitude: 101.6535426 },
        { name: "BSB 3", latitude: 3.118244432, longitude: 101.6534569 },
        { name: "BSB 4", latitude: 3.118246684, longitude: 101.6534254 },
        { name: "BSB 5", latitude: 3.118262449, longitude: 101.6533351 },
        { name: "BSB 6", latitude: 3.118334517, longitude: 101.6533351 },
        { name: "BSB 7", latitude: 3.118325509, longitude: 101.6534118 },
        { name: "BSB 8", latitude: 3.118330013, longitude: 101.6534682 },
        { name: "BSB 9", latitude: 3.118311996, longitude: 101.6535832 },
      ],
    },
    {
      name: "Block H08",
      faculty_block_rooms: [
        { name: "Makmal Utiliti", latitude: 3.118264157, longitude: 101.6529066 },
        { name: "Makmal Komputer G2", latitude: 3.118247126, longitude: 101.6527965 },
        { name: "Makmal Komputer G3", latitude: 3.118306972, longitude: 101.6526701 },
      ],
    },
    {
      name: "Block H09",
      faculty_block_rooms: [
        { name: "Dewan Serbaguna FPE", latitude: 3.118289231, longitude: 101.6523765 },
      ],
    },
    {
      name: "Block H10",
      faculty_block_rooms: [
        { name: "Pejabat Pentadbiran UG", latitude: 3.118602116, longitude: 101.652887 },
      ],
    },
    {
      name: "Block H11",
      faculty_block_rooms: [
        { name: "DK 1", latitude: 3.119020025, longitude: 101.6527665 },
        { name: "DK 2", latitude: 3.119009085, longitude: 101.6525386 },
        { name: "DK 3", latitude: 3.11925633, longitude: 101.6525298 },
        { name: "DK 4", latitude: 3.119166622, longitude: 101.6527095 },
        { name: "DK 5", latitude: 3.119030965, longitude: 101.6526745 },
      ],
    },
    {
      name: "Block H12",
      faculty_block_rooms: [
        { name: "BSP 0-2", latitude: 3.118998145, longitude: 101.6518243 },
        { name: "BSP 0-3", latitude: 3.119000333, longitude: 101.6517673 },
        { name: "BSP 0-4", latitude: 3.119094417, longitude: 101.6519492 },
        { name: "BSP 1-1", latitude: 3.118989393, longitude: 101.6518243 },
        { name: "BSP 1-2", latitude: 3.118923753, longitude: 101.6521376 },
        { name: "BSP 1-3", latitude: 3.118838421, longitude: 101.6521004 },
        { name: "BSP 1-4", latitude: 3.118805601, longitude: 101.6519908 },
        { name: "BSP 1-5", latitude: 3.118919377, longitude: 101.6521113 },
        { name: "BSP 1-6", latitude: 3.118779345, longitude: 101.6519294 },
        { name: "BSP 1-7", latitude: 3.118770593, longitude: 101.651844 },
        { name: "Makmal Komputer Pascasiswazah", latitude: 3.118827481, longitude: 101.6517519 },
      ],
    },
    {
      name: "Bangunan Azman Hashim",
      faculty_block_rooms: [
        { name: "Bilik Seminar 1", latitude: 3.119605361, longitude: 101.6533509 },
        { name: "Bilik Seminar 2", latitude: 3.11951872, longitude: 101.6533571 },
        { name: "Bilik Seminar 3", latitude: 3.119342345, longitude: 101.6534873 },
        { name: "Bilik Seminar 4", latitude: 3.11933925, longitude: 101.6532518 },
        { name: "Bilik Seminar 5", latitude: 3.119506343, longitude: 101.6532146 },
        { name: "Bilik Seminar 6", latitude: 3.119503248, longitude: 101.6533974 },
        { name: "Bilik Seminar 7", latitude: 3.119534192, longitude: 101.6531123 },
        { name: "Bilik Seminar 8", latitude: 3.119528003, longitude: 101.6530782 },
        { name: "Makmal Komputer GSB", latitude: 3.11936091, longitude: 101.6533571 },
      ],
    },
  ],
});
export default FacultyBusiness;