const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check } = require("express-validator");
const usersController = require("../../controllers/UsersController");
const acl = require("../../middleware/acl");

//@route Post api/users
//@desc REGISTER user
//@access Public
router.post(
  "/",
  [
    check("firstName", "firstName is required").not().isEmpty(),
    check("lastName", "lastName is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  usersController.registerUser
);

//@route Post api/users
//@desc Update user
//@access private
router.put(
  "/:userId",
  auth,
  acl.grantAccess("updateAny", "user"),
  [
    check("firstName", "firstName is required").not().isEmpty(),
    check("lastName", "lastName is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
    check("userId", "Please include a valid user id").isMongoId().notEmpty(),
  ],
  usersController.updateUser
);

//@route GET api/users
//@desc GET ALL registered users
//@access private
router.get(
  "/",
  auth,
  acl.grantAccess("readAny", "patient"),
  usersController.getAllActiveUsers
);

module.exports = router;
