import{ Router} from 'express'
import{ createOffer, getOffer, getOfferById} from '../controllers/offer.controller.js'
import { verifyJWT } from '../middleware/auth.middleware.js'


const router = Router()

router.route("/create")
    .get((req , res) => {

        const defaultData = {
            items: [],
            clientName: "",
            projectName: "",
            typeOfChute: "",
            materialOfChute: "",
            diameterOfChute: "",
            thicknessOfChute: "",
            numberOfTower: "",
            numberOfOpening: "",
            towerName: "",
            projectLocation: "",
            subTotal: 0,
            taxPercentage: 18,
            taxAmount: 0,
            grandTotal: 0
        };

        res.render("offer" , defaultData)
    })
    .post( createOffer)

router.route("/all-offer")
   .get(getOffer)

router.get('/offer/:id/pdf', getOfferById);

export  default router