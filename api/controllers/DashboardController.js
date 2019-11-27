/** 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

module.exports = {
    index: function (req, res) {
        /*async.parallel({
            stamps: function (cb) {
                Stamp.find({
                    user: req.user.id
                }).sort('date DESC')
                        .populate('node')
                        .exec(cb);
            },
            nodes: function (cb) {
                  Node.find({ 
                      administrator: req.user.id
                  })
                      .populate('administrator')
                      .exec(cb)
//                User.findOne(req.user.id)
//                        .populate('uses')
//                        .exec(function (err, user) {
//                            if (err)
//                                return cb(err);
//                            if (!user || !user.uses.length)
//                                return cb(undefined, []);
//                            Node.find(user.uses.map(function (node) {
//                                return node.id;
//                            }))
//                                    .populate('administrator')
//                                    .populate('stamps')
//                                    .exec(cb);
//                        });
            }
        },
                function (err, result) {
                    if (err)
                        return res.serverError(err);

                    return res.view(result);
                });
                */
        return res.view();
    },
    nodes: function (req, res) {
        User.findOne(req.user.id)
                .populate('uses')
                .exec(function (err, user) {
                    if (err)
                        return res.serverError(err);
                    if (!user || !user.uses.length)
                        return res.ok([]);
                    Node.find(user.uses.map(function (node) {
                        return node.id;
                    }))
                            .populate('stamps')
                            .exec(function (err, nodess) {
                                if (err)
                                    return res.serverError(err);

                                return res.ok(nodess);
                            });
                });
    }
};