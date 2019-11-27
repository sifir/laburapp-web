/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var _ = require('lodash');
var _super = require('sails-permissions/dist/api/models/User');

_.merge(exports, _super);
_.merge(exports, {
    attributes: {
        firstName: 'string',
        lastName: 'string',

        /**
         * @ORM({association: 'One to many', model: 'Node'})
         * @type Node.js
         */
        manages: {
            collection: 'node',
            via: 'administrator'
        },

        /**
         * @ORM({association: 'one to many', model: 'Node'})
         * @type Node.js
         */
        uses: {
            collection: 'node',
            via: 'users'
        },

        /**
         * @ORM({association: 'one to many', model: 'shift'})
         * @type shift.js
         */
        shifts: {
            collection: 'shift',
            via: 'user'
        },

        /**
         * @ORM({association: 'one to many', model: 'stamps'})
         * @type stamp.js
         */
        stamps: {
            collection: 'stamp',
            via: 'user'
        },

        /**
         * @ORM({association: 'one to many', model: 'Invite'})
         * @type Invite.js
         */
        invites: {
            collection: 'invite',
            via: 'requested'
        }
    },
    afterValidate: [
        function updatePassword(values, next) {
            // Update the passport password if it was passed in
            if (values.password && this.user && this.user.id) {
                Passport.update({ user: this.user.id, protocol: 'local' }, { password: values.password })
                    .exec(function (err) {
                        delete values.password;
                        next(err);
                    });
            }
            else {
                next();
            }
        }
    ]
});
