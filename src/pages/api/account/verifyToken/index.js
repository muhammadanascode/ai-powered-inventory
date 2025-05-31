import authenticate from "@/middlewares/auth";

export default async function handler (req, res) {

    authenticate(req, res, async()=>{
        return res.status(200).json({valid:true})
    })

}