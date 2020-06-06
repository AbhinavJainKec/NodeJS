const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Dishes = require('../models/dishes');
const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .populate("user")
    .populate("dishes")
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
    },(err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403; // method not supported
    res.end('PUT Operation Not Supported On /favorite/' + req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }).then(
      (fav) => {
        let favorite;
        if (fav === null) {
          favorite = new Favorites();
          favorite.user = req.user._id;
        } else {
          favorite = fav;
        }
        // check if some dishes in req body are present already in favorite list of user
        const isAlreadyFavorite = req.body.some((dish) => favorite.dishes.indexOf(dish._id) !== -1);
        if (isAlreadyFavorite) {
          const err = new Error(
            "some dishes already exists in favorite list of user. Please remove them and try again"
          );
          err.status = 400;
          return next(err);
        }
        req.body.forEach((dish) => {
          // check if req body contains duplicate dish ids
          if (favorite.dishes.indexOf(dish._id) !== -1) {
            const err = new Error("req contains duplicate dish ids");
            err.status = 400;
            return next(err);
          } else {
            favorite.dishes.push(dish._id);
          }
        });
        favorite.save().then(
          (updatedFavorite) => {
            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json");
            res.json(updatedFavorite);
          },(err) => next(err));
      },(err) => next(err)
    );
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({ user: req.user._id })
    .then((favorite) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorite);
    },(err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route("/:dishId")
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
res.statusCode = 403; // method not supported
res.end('GET operation not supported on /favorite/' + req.params.dishId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
res.statusCode = 403; // method not supported
res.end('PUT operation not supported on /favorite/' + req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
    // if no dish, then return error
    if (dish === null) {
        const err = new Error(`Dish with id ${req.params.dishId} not found`);
        err.status = 404;
        return next(err);
    } else {
        Favorites.findOne({ user: req.user._id }).then(
        (fav) => {
            let favorite;
            // if favorite exists then it will use old one otherwise it will create new Favorite document for the user
            if (fav === null) {
            favorite = new Favorites();
            favorite.user = req.user._id;
            } else {
            favorite = fav;
            }
            if (favorite.dishes.indexOf(dish._id) !== -1) {
            const err = new Error("Dish Already Exists In Favorite");
            err.status = 500;
            return next(err);
            }
            favorite.dishes.push(dish._id);
            favorite.save().then((updatedFavorite) => {
                res.statusCode = 201;
                res.setHeader("Content-Type", "application/json");
                res.json(updatedFavorite);
            },(err) => next(err));
        },(err) => next(err));
    }
    })
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then((favorite) => {
        // if favorite list exists and :dishId is in the favorite.dishes then only remove it.
        if (favorite !== null && favorite.dishes.indexOf(req.params.dishId) !== -1) {
        favorite.dishes.splice(favorite.dishes.indexOf(req.params.dishId), 1);
        favorite.save().then((updatedFavorite) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(updatedFavorite);
        });
        } else {
        const err = new Error("dish is not available in user favorite list");
        err.status = 404;
        return next(err);
        }
    },(err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;