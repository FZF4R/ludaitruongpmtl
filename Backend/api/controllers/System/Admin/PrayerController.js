/**
 * PrayerController (quản trị)
 *
 * Duyệt / bỏ duyệt một lời nguyện làm "nổi bật" (hiện trong slideshow phía
 * trên ô viết ở trang chủ). Quyền `comment.moderate` - cùng người kiểm duyệt
 * bình luận và lời nguyện.
 */

module.exports = {

    setFeatured: ({
        inputs: sails.config.inputs.Admin.Prayer.setFeatured,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let ln = await Prayer.findOne({ id: String(inputs.id) })
                if (!ln || ln.status !== 'visible') {
                    return sails.checkErrorOutput({ messageNode: 'Users', message: 'prayerNotFound' }, exits)
                }

                await Prayer.updateOne({ id: ln.id }).set({
                    featured: !!inputs.featured,
                    featuredBy: inputs.featured ? String(inputs.User.id) : ''
                })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { id: String(ln.id), featured: !!inputs.featured }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
