const userHelpers = require("../helpers/userHelpers");
const mongoose = require("mongoose");
const otp = require("../utilities/otp");
const bcrypt = require("bcrypt");
const customer = require("../models/userDataBase");
const products = require("../models/productDataBase");
const category = require("../models/categoryDataBase");
const objId = require("mongoose").Types.ObjectId;

module.exports = {
  /* user home page */
  home: async (req, res) => {
    let users = req.session.user;
    let showCategory = await category.find();

    res.render("user/index", { users, user: true, admin: false, showCategory, page: "home" });
  },

  /* user login submition case */
  userLogIn: async (req, res) => {
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.user = response.user;
        req.session.loggedIn = true;
        res.redirect("/");
      } else {
        if (response.access == false) {
          req.session.loginErr = "You are Blocked!";
          req.session.loggedIn = false;
          res.redirect("/login");
        } else {
          req.session.loggedIn = false;
          req.session.loginErr = "Invalid username or password";
          res.redirect("/login");
        }
      }
    });
  },

  /* user login page */
  login: (req, res) => {
    if (req.session.user) {
      res.redirect("/");
    } else {
      let logErr = req.session.loginErr;
      req.session.loginErr = false;
      res.render("user/login", { user: false, admin: false, logErr, showCategory: false });
    }
  },

  /* user signup page */
  signup: (req, res) => {
    if (req.session.loggedIn) {
      res.redirect("/");
    } else {
      res.render("user/signup", { user: false, admin: false, showCategory: false });
    }
  },

  /* user signup submition case */
  userSignUp: async (req, res) => {
    try {
      const email = req.body.email;
      const phone = req.body.phone;
      req.session.signup = req.body;
      const user = await customer.findOne({ email: email });
      console.log("userSignUp working...");
      if (user) {
        req.session.loggedIn = true;
        res.redirect("/");
      } else {
        otp.sendOtp(phone);
        res.render("user/otpSection", {
          user: false,
          admin: false,
          phone,
          showCategory: false
        });
      }
    } catch (error) {
      console.log(error);
    }
  },

  /* otp generation for create a account and store data into database */
  generateOtp: async (req, res) => {
    try {
      /* console.log("generateOtp working...");
      console.log("req.session.signup ===> " + req.session.signup); */
      let { fullName, email, phone, nPassword, cPassword } = req.session.signup;
      let otps = req.body.otps;
      /* console.log("otps ===> " + otps); */
      await otp.verifyOtp(phone, otps).then(async (verification_check) => {
        /*         console.log("before ===> " + verification_check.status); */
        if (verification_check.status == "approved") {
          /* console.log("after ===> " + verification_check.status);
          console.log("passwords ::====> " + nPassword, cPassword); */
          nPassword = await bcrypt.hash(nPassword, 10);
          cPassword = await bcrypt.hash(cPassword, 10);
          /*    console.log("otp verifying"); */
          let newPerson = new customer({
            fullName: fullName,
            email: email,
            phone: phone,
            nPassword: nPassword,
            cPassword: cPassword
          });
          newPerson.save((err, newUser) => {
            if (err) {
              console.log(err);
              res.redirect("/signup");
            } else {
              req.session.loggedIn = true;
              res.redirect("/");
            }
          });
          console.log("new person added to database ===> " + newPerson);
        } else {
          req.session.loggedIn = false;
          res.send("otp error! otp did not match!");
        }
      });
    } catch (error) {
      console.log(error);
    }
  },

  /* logout router */
  userLogOut: (req, res) => {
    req.session.loggedIn = false;
    req.session.user = null;
    res.redirect("/");
  },

  /* products displaying */
  products: async (req, res) => {
    let users = req.session.user;
    let showCategory = await category.find({ access: true });
    let displayProduct;
    if (req.query.category) {
      displayProduct = await products.find({ category: req.query.category });
    } else if (req.query.q) {
      displayProduct = await products.find({
        tittle: { $regex: new RegExp("^" + req.query.q + ".*", "i") }
      });
    } else {
      displayProduct = await products.find({ access: true });
    }
    res.render("user/productsList", {
      user: true,
      admin: false,
      users,
      showCategory,
      displayProduct,
      page: "furnitures"
    });
  },

  /* product detail showing */
  productDetail: async (req, res) => {
    let users = req.session.user;
    let showCategory = await category.find({ access: true });
    let proId = req.params.id;
    let productData = await products.find({ _id: proId });
    console.log("product detail :" + productData);
    res.render("user/productDetail", {
      user: true,
      admin: false,
      showCategory,
      users,
      productData,
      page: "product-detail"
    });
  },

  /* Product searching */
  productSearching: (req, res) => {
    userHelpers.searching(req, res);
  },

  /* to user cart page */
  userCart: (req, res) => {
    if (req.session.user) {
      userHelpers.cart(req, res);
    } else {
      res.redirect("/login");
    }
  },

  /* add to cart a product */
  addToCart: (req, res) => {
    if (req.session.user) {
      userHelpers.addToCart(req, res);
    } else {
      res.redirect("/login");
    }
  },

  /* change cart item quantiy */
  changeQuantity: (req, res) => {
    userHelpers.changeQuantity(req, res);
  },

  /* to show wishlist */
  wishlist: (req, res) => {
    if (req.session.user) {
      userHelpers.wishlist(req, res);
    } else {
      res.redirect("/login");
    }
  },

  /* to add item to wishlist */
  addToWishlist: (req, res) => {
    if (req.session.user) {
      userHelpers.addToWishlist(req, res);
    } else {
      res.redirect("/login");
    }
  },

  /* to remove wishlist item */
  removeWishlistItem: (req, res) => {
    userHelpers.removeWishlistItem(req, res);
  },

  /* to user profile section */
  userProfile: async (req, res) => {
    if (req.session.user) {
      let users = req.session.user;
      let showCategory = await category.find({ access: true });
      res.render("user/userProfile", {
        user: false,
        admin: false,
        showCategory,
        users,
        page: "user-profile"
      });
    } else {
      res.redirect("/login");
    }
  },

  /* to user addresses page */
  userAddress: async (req, res) => {
    if (req.session.user) {
      let users = req.session.user;
      let showCategory = await category.find({ access: true }); /* 
    let address = await customer.findById(req.session.user._id); */
      let user = await customer.findOne({ _id: req.session.user._id });
      console.log("user ======== > : " + user);
      let userAddr = user.address 
      let addresses = await userAddr.find
      res.render("user/userAddress", {
        user: false,
        admin: false,
        showCategory,
        users,
        page: "user-profile"
      });
    } else {
      res.redirect("/login");
    }
  },

  /* to edit user details */
  editDetails: (req, res) => {
    if (req.session.user) {
      userHelpers.editUserDetails(req, res);
    } else {
      res.redirect("/login");
    }
  },

  /* to change password by user detail */
  changeUserPassword: (req, res) => {
    if (req.session.user) {
      userHelpers.changeUserPassword(req, res);
    } else {
      res.redirect("/login");
    }
  },

  /* add a new address */
  addAddress: (req, res) => {
    if (req.session.user) {
      userHelpers.addAddress(req, res);
    } else {
      res.redirect("/login");
    }
  },

  //to edit address
  editAddress: (req, res) => {
    if (req.session.user) {
      userHelpers.editAddress(req, res);
    } else {
      res.redirect("/login");
    }
  },

  //to delete user a address
  deleteAddress: (req, res) => {
    userHelpers.deleteAddress(req, res);
  }
};
