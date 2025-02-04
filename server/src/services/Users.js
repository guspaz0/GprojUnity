const { Users } = require('../db');
const {Op} = require('sequelize');
var pbkdf2 = require('pbkdf2');
var salt = process.env.SALT_KEY;
const cloudinary = require("cloudinary").v2;

const {
  CB_CLOUD_NAME,
  CB_API_KEY ,
  CB_API_SECRET,
} = process.env;

cloudinary.config({
  cloud_name: CB_CLOUD_NAME,
  api_key: CB_API_KEY,
  api_secret: CB_API_SECRET,
  secure: true,
});


function encryptionPassword(password) {
    var key = pbkdf2.pbkdf2Sync(
        password, salt, 36000, 64, 'sha256'
    );
    var hash = key.toString('hex');
    return hash;
}


const userServices = {
    allUsers: async function (queryParams) {
        try{
          const { name, deleted } = queryParams

          const response = await Users.findAll({
              where: name? {
                name: { [Op.iLike]: `%${name}%` },
                [Op.or]: [{ name: { [Op.iLike]: `${name}%` } }],
              } : null,
              paranoid: deleted? false : true,
              attributes: {exclude: ['password']},
          })
          return response
        } catch (error) {
            return error
        }
    },
    userById: async function(id) {
      try {
        const userId = await Users.findOne({
          where: {id: id},
          attributes: {exclude: ['password']}
        });
        if (userId) {
          return userId
        } else {
          return 'User not Found'
        }
      } catch (error) {
        return error
      }
    },
    createUser: async function (userData) {
        try {
            const { name, email, password, image, twitterUser, emailUser, githubUser, linkedinUser, role} = userData

            if ( !name || !email || !password /* || !image || !twitterUser || !emailUser || !githubUser <<== MODIFIQUE ESTO PARA PODER CREAR USUARIOS */ || !role) {

                throw Error(`Missing some data`)
            } else {
            let uploadedImage;
            if (image) {
                uploadedImage = await cloudinary.uploader.upload(image);
            }
                const [newUser, created] = await Users.findOrCreate({
                    where: {email: email},
                    defaults: {
                        name,
                        email,
                        password: encryptionPassword(password),
                        image: uploadedImage? uploadedImage.secure_url : null,
                        twitterUser,
                        emailUser,
                        githubUser,
                        role,
                        linkedinUser
                    }
                })
                if (created) {
                    let { id, name, email, image, twitterUser,emailUser, githubUser, linkedinUser, role } = newUser
                    return { id, name, email, image, twitterUser, emailUser, githubUser, linkedinUser, role }
                } else {
                    throw Error('El email de usuario ya existe')
                }
            }
        } catch (error){
            return error
        }
    },

    updateUser: async function (userData, res){
        try {
            const { id, name, email, password, image, twitterUser, emailUser, githubUser, linkedinUser, roleId} = userData
            // find the user by ID
            const user = await Users.findByPk(id);
            if (!user) {
                throw new Error("User not found");
            }
            // update the user data
            user.name = name || user.name;
            user.email = email || user.email;
            user.password = password ? encryptionPassword(password) : user.password;
            user.twitterUser = twitterUser || user.twitterUser;
            user.emailUser = emailUser || user.emailUser;
            user.githubUser = githubUser || user.githubUser;
            user.linkedinUser = linkedinUser || user.linkedinUser;
            user.roleId = roleId || user.roleId;
   
            // upload the image to Cloudinary
            if (image) {
              const uploadedImage = await cloudinary.uploader.upload(image);
              user.image = uploadedImage.secure_url;
            }
   
            // save the changes
            await user.save();
   
            // return the updated user object
            res.status(200).json(user);
        } catch (error) {
            console.log(error);
            return error;
        }
    },
    deleteUserbyId: async function(userId) {
        try {
          const user = await Users.findByPk(userId);
          if (!user) {
            throw new Error('User not found');
          }
          await user.destroy();
          return { message: 'User deleted successfully' };
        } catch (error) {
          throw new Error(error.message);
        }
      },
    
      getDeletedUsers: async function () {
        try {
            const deletedUsers = await Users.findAll({
                paranoid: false,
                attributes: {exclude: ['password']}
            });
            
            return deletedUsers;
        } catch (error) {
            throw new Error(error.message);
        }
    },

      restoreUsers: async function(userId) {
        try {
          const user = await Users.findOne({where: {id: userId}, paranoid: false});
          if (!user) {
            throw new Error('User not found');
          }
          await user.restore();
          return { message: 'User restored successfully' };
        } catch (error) {
          throw new Error(error.message);
        }
      },
    
}

module.exports = userServices
