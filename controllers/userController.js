const User = require('../models/user');
const { body, validationResult } = require("express-validator");
const passport = require('passport');

const asyncHandler = require("express-async-handler");

// Display list of all Users.
exports.user_list = [
  isAdmin,

  asyncHandler(async (req, res, next) => {
    const allUsers = await User.find().sort({ name: 1 }).exec();
    res.render("user_list", {
      title: "Users List",
      user_list: allUsers,
    });
  })
];

// Display detail page for a specific user.
exports.user_profile = [
    isPageOwnedByUser,
  
    asyncHandler(async (req, res, next) => {
        const found_user = await User.findById(req.params.id).exec();
        
        if (found_user == null) {
            let err = new Error('User not found');
            err.status = 404;
            return next(err);
        }

        // Successful, so render
        res.render('user_profile', {
            title: 'User Profile',
            user: found_user
        });
    }),
];


// Display login form on GET.
exports.login_get = [
    isAlreadyLoggedIn,
  
    function(req, res, next) {
      const messages = extractFlashMessages(req);
      res.render('user_login', {
        title: 'Login',
        errors: messages.length > 0 ? messages : null
      });
    }
];

// Display warning page on GET.
exports.warning = [
    function(req, res, next) {
      const messages = extractFlashMessages(req);
      res.render('user_warning', {
        title: 'Sorry!',
        errors: messages.length > 0 ? messages : null
      });
    }
];

// Handle login form on POST
exports.login_post = [
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/users/login',
      failureFlash: true
    })
];

// Handle logout on GET.
exports.logout_get = [

  function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  }, 
    
  // function(req, res, next) {
  //     req.logout(err => {return next(err)});
  //         // тут выскакивает ошибка regenerate
  //     req.session.destroy(err => {return next(err)});
  //     res.redirect('/');
  // }
];

// Display register form on GET.
exports.register_get = [
    isAlreadyLoggedIn,
  
    // Continue processing.
    function(req, res, next) {
      res.render('user_form', {
        title: 'Create User'
      });
    }
];

// Handle register on POST.
exports.register_post = [
    // Validate fields.
    body('username')
        .trim()
        .isLength({ min: 3 })
        .escape()
        .withMessage('Username must be at least 3 characters long.'),
    body('fullname')
        .trim()
        .isLength({ min: 3 })
        .escape()
        .withMessage('Family name must be at least 3 characters long.'),
    body('email')
        .trim()
        .isEmail()
        .escape()
        .normalizeEmail({all_lowercase: true})
        .withMessage('Please enter a valid email address.'),
    body('role')
        .trim()
        .isLength({ min: 1 })
        .withMessage('A role must be selected for the user.'),
    body('password')
        .trim()
        .isLength({ min: 4, max: 32 })
        .escape()
        .withMessage('Password must be between 4-32 characters long.'),
    body('password_confirm')
        .trim()
        .isLength({ min: 4, max: 32 })
        .escape(),
  
    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Get a handle on errors.array() array,
      // so we can push our own error messages into it.
      const errorsArray = errors.array();
  
      // Create a user object with escaped and trimmed data.
      // Only role "0" allowed when register new user
      // Ask Admin to upgrade role updating the user
      // Only Admin can set role "1" or "2"
      const user = new User({
        username: req.body.username,
        fullname: req.body.fullname,
        email: req.body.email,
        role: 0,
        //role: Number.parseInt(req.body.role),
      });
  
      // Check if passwords match or not.
      if (!user.passwordsMatch(req.body.password, req.body.password_confirm)) {
        // Passwords do not match. Create and push an error message.
        errorsArray.push({ msg: 'Passwords do not match.' });
      }
  
      if (errorsArray.length > 0) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('user_form', {
          title: 'Create User',
          user: user,
          errors: errorsArray
        });
        return;
      } else {
        // Data from form is valid.
  
        // Passwords match. Set password.
        user.setPassword(req.body.password);
  
        // Check if User with same username already exists.
        const found_user = await User.findOne({ username: req.body.username }).exec();

        if (found_user) {
            // Username exists, re-render the form with error message.
            res.render('user_form', {
              title: 'Create User',
              user: user,
              errors: [{ msg: 'Username already taken. Choose another one.' }]
            });
        } else {
            // User does not exist. Create it.
            await user.save();
              // User saved. Redirect to login page.
            req.flash('success', 'Successfully registered. You can log in now!');
            res.redirect('/users/login');
        };
      }
    }),
];
  
// Display update form on GET.
exports.update_get = [
    isPageOwnedByUser,
  
    asyncHandler(async (req, res, next) => {
      const found_user = await User.findById(req.params.id).exec();

      if (found_user == null) {
        let err = new Error('User not found');
        err.status = 404;
        return next(err);
      }
        // Successful, so render
      res.render('user_form', {
        title: 'Update User',
        user: found_user,
        is_update_form: true
      });
    })
];

// Handle update on POST.
exports.update_post = [
  isPageOwnedByUser,
  
    // Validate fields.
    body('username')
        .trim()
        .isLength({ min: 3 })
        .escape()
        .withMessage('Username must be at least 3 characters long.'),
    body('fullname')
        .trim()
        .isLength({ min: 3 })
        .escape()
        .withMessage('Family name must be at least 3 characters long.'),
    body('email')
        .trim()
        .isEmail()
        .escape()
        .normalizeEmail({all_lowercase: true})
        .withMessage('Please enter a valid email address.'),
    body('role')
        .trim()
        .isLength({ min: 1 })
        .withMessage('A role must be selected for the user.'),
    body('password')
        .optional({ values: "falsy" })  // difference with register_POST
        .trim()
        .isLength({ min: 4, max: 32 })
        .escape()
        .withMessage('Password must be between 4-32 characters long.'),
    body('password_confirm')
        .optional({ values: "falsy" })  // difference with register_POST
        .trim()
        .isLength({ min: 4, max: 32 })
        .escape(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Get a handle on errors.array() array.
      let errorsArray = errors.array();

      // Only Admin can upgrade role to "1" or "2"
      let newRole = Number.parseInt(req.body.role);
      if(newRole != 0){
        const found_user = await User.findById(req.params.id).exec();
        
        if(newRole > found_user.role){
          if(req.user.role != 2 ){
            newRole = found_user.role;
          }
        }
      }
  
      // Create a user object with escaped and trimmed data and the old _id!
      const user = new User({
        username: req.body.username,
        fullname: req.body.fullname,
        email: req.body.email,
        role: newRole,
        _id: req.params.id
      });
  
      // Update password if the user filled ONE OF password fields!
      if (req.body.password != '' || req.body.password_confirm != '') {
        // -- The user wants to change password. -- //

        // Check password length.
        if(req.body.password.length < 4 || req.body.password.length > 32){
          // Passwords out of range. Create and push an error message.
          errorsArray.push({ msg: 'Passwords must be between 4-32 characters long.' });
        }
  
        // Check if passwords match or not.
        if (!user.passwordsMatch(req.body.password, req.body.password_confirm)) {
          // Passwords do not match. Create and push an error message.
          errorsArray.push({ msg: 'Passwords do not match.' });
        } else {
          // Passwords match. Set password.
          user.setPassword(req.body.password);
        }
      } else {
        // -- The user does not want to change password. -- //
  
        // Remove warnings that may be coming from the body(..) validation step above.
        const filteredErrorsArray = [];
        errorsArray.forEach(errorObj => {
          if (!(errorObj.param == 'password' || errorObj.param == 'password_confirm')) {
            filteredErrorsArray.push(errorObj);
          }
        });
        // Assign filtered array back to original array.
        errorsArray = filteredErrorsArray;
      }
  
      if (errorsArray.length > 0) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('user_form', {
          title: 'Update User',
          user: user,
          errors: errorsArray,
          is_update_form: true
        });
        return;
      } else {
        // Data from form is valid. Update the record.
        const theuser = await User.findByIdAndUpdate(req.params.id, user, {});
        // redirect to user detail page.
        res.redirect(theuser.url);
      }
    })
];

// Display reset password form on GET.
exports.reset_get = [
    isAlreadyLoggedIn,
  
    function(req, res, next) {
      res.render('user_reset', {
        title: 'Reset Password',
        is_first_step: true
      });
    }
];

// Handle reset password on POST (1st step).
exports.reset_post = [
    // First step of the password reset process.
    // Take username and email from form, and try to find a matching user.
  
    // Validate fields.
    body('username')
        .trim()
        .isLength({ min: 3 })
        .escape()
        .withMessage('Username must be at least 3 characters long.'),

    body('email')
        .trim()
        .isEmail()
        .escape()
        .normalizeEmail({all_lowercase: true})
        .withMessage('Please enter a valid email address.'),
  
    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Get a handle on errors.array() array.
      const errorsArray = errors.array();
  
      // Create a user object with escaped and trimmed data.
      const user = new User({
        username: req.body.username,
        email: req.body.email
      });
  
      if (errorsArray.length > 0) {
        // There are errors. Render the form again with sanitized values/error messages.
        // The user couldn't pass this step yet. Hence we're still in the first step!
        res.render('user_reset', {
          title: 'Reset Password',
          is_first_step: true,
          user: user, // Pass user object created with user-entered values.
          errors: errorsArray
        });
        return;
      } else {
        // Data from form is valid.
  
        // Check if User exists. Можно искать только по email
        const found_user = await User.findOne({ username: req.body.username, email: req.body.email }).exec();

        if (found_user) {
            // User exists and credentials did match. Proceed to the second step.
            // And pass found_user to the form. We'll need user._id in the final step.
            res.render('user_reset', {
              title: 'Reset Password',
              is_second_step: true,
              user: found_user // Pass found_user.
            });
          } else {
            // User does not exist or credentials didn't match.
            // Render the form again with error messages. Still first step!
            res.render('user_reset', {
              title: 'Reset Password',
              is_first_step: true,
              user: user, // Pass user object created with user-entered values.
              errors: [{ msg: 'The user does not exist or credentials did not match a user. Try again.' }]
            });
          }
      }
    })
];

// Handle reset password on POST (2nd step).
exports.reset_post_final = [
    // Second and the final step of the password reset process.
    // Take userid, password and password_confirm fields from form,
    // and update the User record.
  
    body('password')
        .trim()
        .isLength({ min: 4, max: 32 })
        .escape()
        .withMessage('Password must be between 4-32 characters long.'),
    body('password_confirm')
        .trim()
        .isLength({ min: 4, max: 32 })
        .escape(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Get a handle on errors.array() array.
      const errorsArray = errors.array();
  
      // Create a user object containing only id field, for now.
      // We need to use old _id, which is coming from found_user passed in the first step.
      const user = new User({
        _id: req.body.userid
      });
  
      // -- Custom Validation -- //
  
      // Check if passwords match or not.
      if (!user.passwordsMatch(req.body.password, req.body.password_confirm)) {
        // Passwords do not match. Create and push an error message.
        errorsArray.push({ msg: 'Passwords do not match.' });
      }
  
      if (errorsArray.length > 0) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('user_reset', {
          title: 'Reset Password',
          is_second_step: true,
          user: user, // We need to pass user back to form because we will need user._id in the next step.
          errors: errorsArray
        });
        return;
      } else {
        // Data from form is valid.
  
        // Passwords match. Set password.
        user.setPassword(req.body.password);
  
        // Update the record.
        const theuser = await User.findById(req.body.userid).exec();
        // This step is required to keep user role unchanged.
        user.role = theuser.role;
        await User.findByIdAndUpdate(req.body.userid, user, {}).exec();
        
        // Success, redirect to login page and show a flash message.
        req.flash('success', 'You have successfully changed your password. You can log in now!');
        res.redirect('/users/login');  
        
      }
    })
];

// Handle User delete on GET. 
// Every request on ../delete needs to have Admin role
exports.delete_get = [
  isPageOwnedByUser, 
  
  asyncHandler(async (req, res, next) => {
  // Get details of user
  const user = await User.findById(req.params.id).exec();
  // Get number of Administrators
  let numAdmins = 2;
  if(user && user.role == 2) {
    numAdmins = await User.countDocuments({ role: 2 }).exec();
  }

  if (user === null) {
    // No results.
    res.redirect("/users");
  }

  res.render("user_delete", {
    title: "Delete User",
    user: user,
    user_num: numAdmins,
  });
})];

// Handle User delete on POST.
exports.delete_post = [
  isPageOwnedByUser,

  asyncHandler(async (req, res, next) => {
  // Get details of user
  const user = await User.findById(req.params.id).exec();
  // Get number of Administrators (You can not delete the last and only Admin)
  let numAdmins = 0;
  if(user && user.role == 2) {
    numAdmins = await User.countDocuments({ role: 2 }).exec();
  }

  if (user.role == 2 && numAdmins < 2) {
    // The only Administrator left. Render in same way as for GET route.
    res.render("user_delete", {
      title: "Delete User",
      user: user,
      user_num: numAdmins,
    });
    return;
  } else {
    // Delete object and redirect to the list of users.
    await User.findByIdAndRemove(req.body.userid);
    res.redirect("/users");
  }  
})];
  
  // -- Helper functions, no need to export. -- //
  
  // Extract flash messages from req.flash and return an array of messages.
function extractFlashMessages(req) {
    const messages = [];
    // Check if flash messages was sent. If so, populate them.
    const errorFlash = req.flash('error');
    const successFlash = req.flash('success');

    // Look for error flash.
    if (errorFlash && errorFlash.length) messages.push({ msg: errorFlash[0] });

    // Look for success flash.
    if (successFlash && successFlash.length) messages.push({ msg: successFlash[0] });

return messages;
}
  
// Function to prevent user who already logged in from
// accessing login and register routes.
function isAlreadyLoggedIn(req, res, next) {
    if (req.user && req.isAuthenticated()) {
        res.redirect('/');
    } else {
        next();
    }
}
  
// Function that confirms that user is logged in and is the 'owner' of the page or Admin.
function isPageOwnedByUser(req, res, next) {
    if (req.user && req.isAuthenticated()) {
        if (
          req.user._id.toString() === req.params.id.toString() ||
          req.user.role === 2 //Admin can view and update too
        ) {
            // User's own page. Allow request.
            next();
        } else {
            // Deny and redirect.
            req.flash('error', "You're not authorized to access this page!");
            res.redirect('/users/stop');
        }
    } else {
        // Not authenticated. Redirect.
        res.redirect('/users/login');
    }
}

// Function that confirms that user is Admin
function isAdmin(req, res, next){
  if (req.user && req.isAuthenticated()) {
    if ( req.user.role === 2 ) {
        // User has Admin role. Allow request.
        next();
    } else {
        // Deny and redirect.
        req.flash('error', "You're not authorized to access this page!");
        res.redirect('/users/stop');
    }
  } else {
    // Not authenticated. Redirect to Login page.
    res.redirect('/users/login');
  }
}
    