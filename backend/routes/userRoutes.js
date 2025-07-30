import express from 'express';
const router = express.Router();
import { addOfficer,
    getAllOfficers,
    updateOfficer,
    deleteOfficer,
    bulkDeleteOfficer 
 } from '../controllers/userController.js';


router.post('/',addOfficer);       
router.get('/', getAllOfficers);       
router.patch('/:id', updateOfficer);
router.delete('/:id', deleteOfficer);  
router.post('/bulk-delete', bulkDeleteOfficer);

export default router;
