const express = require("express");
const router = express.Router();
const { 
    createList, getPopularLists, getListDetails, toggleSaveList, 
    getMyLists, getSavedLists, searchLists, updateList, deleteList
} = require("../controllers/listController");

router.post("/create", createList);
router.get("/popular", getPopularLists);
router.get("/search", searchLists); 
router.get("/user/:userId", getMyLists);
router.get("/user/:userId/saved", getSavedLists);
router.get("/:listId", getListDetails);
router.post("/:listId/save", toggleSaveList);
router.put("/:listId", updateList);
router.delete("/:listId", deleteList);


module.exports = router;