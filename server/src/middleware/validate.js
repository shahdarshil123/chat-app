import { z } from "zod";

export const validate = (schemas) => (req, res, next) => {
    try {
        // 1. Verify Body
        if (schemas.body) {
            schemas.body.parse(req.body);
        }

        // 2. Verify Query Parameters
        if (schemas.query) {
            schemas.query.parse(req.query);
        }

        // 3. Verify URL Parameters
        if (schemas.params) {
            schemas.params.parse(req.params);
        }

        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                error: err._zod.def[0].message,
            });
        }
        console.error("Validation Error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};