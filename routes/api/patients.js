const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check } = require("express-validator");
const PatientsController = require("../../controllers/PatientsController");
const acl = require("../../middleware/acl");

//@route Post api/users
//@desc Create Patient information for user
//@access Public
router.post(
  "/",
  [
    check("address", "address is required").not().isEmpty(),
    check("dni", "dni is required").not().isEmpty(),
    check("birthDate", "birthDate is required").not().isEmpty(),
  ],
  auth,
  acl.grantAccess("createOwn", "patient"),
  PatientsController.createPatient
);

router.get(
  "/",
  auth,
  acl.grantAccess("readAny", "patient"),
  PatientsController.getAllPatients
);

module.exports = router;
