/**
 * StampController
 *
 * @description :: Server-side logic for managing stamps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    create: function (req, res) {
        //busca si hay un shift empezado ese dia
        let userId = req.param('user');
        let tag = req.param('tag');

        let dayStarts = new Date();
        dayStarts.setHours(0, 0, 0, 0);
        let dayEnds = new Date();
        dayEnds.setHours(23, 59, 59, 999);

        async.waterfall([
            function (cb) {
                //busco el usuario y sus nodos
                User.findOne(userId)
                    .populate("uses")
                    .exec(function (err, user) {
                        if (err)
                            return cb(err);
                        if (!user)
                            return cb({status: 400, message: 'No existe el usuario con ID: ' + userId});
                        return cb(undefined, user.uses);
                    });
            },
            function (nodes, cb) {
                //me fijo si tiene este nodo
                let node = _.find(nodes, { 'tag': tag });
                if (!node)
                    return cb({ status: 400, message: 'El usuario no tiene asignado este nodo' });
                return cb(undefined, node);
            },
            function (node, cb) {
                Shift.findOne()
                    .where({
                        user: userId,
                        node: node.id,
                        started: {
                            '>=': dayStarts,
                            '<=': dayEnds
                        }
                    }).exec(function (err, shift) {
                        return cb(err, shift, node);
                    });
            },
            function (shift, node, cb) {
                if (!shift) {
                    //si no encontro turno del dia lo crea
                    Shift.create({
                        user: userId,
                        node: node
                    }).exec(cb);
                } else {
                    // si el turno termino devuelvo error
                    if (shift.ended)
                        return cb({ status: 400, message: "Usted ya ficho salida para hoy" });

                    // actualizo fecha de salida
                    shift.ended = new Date();
                    shift.save(function (err) {
                        return cb(err, shift);
                    });
                }
            }
        ], function (err, shift) {
            Stamp.create({
                user: userId,
                error: (err && err.message) || err,
                shift: shift
            }).exec(function (err, stamp) {
                if (err)
                    return res.negotiate(err);

                stamp.shift = shift;
                return res.created(stamp);
            });
        });
    }


};

