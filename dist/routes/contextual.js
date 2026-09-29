"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const ContextualSuggestionService_js_1 = require("../services/contextual/ContextualSuggestionService.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { page, originPort, destinationPort, cargoQuantityMt, vesselClass, targetDate, currentRateUsdMt } = req.query;
        const params = {
            page: page,
            originPort: originPort,
            destinationPort: destinationPort,
            cargoQuantityMt: cargoQuantityMt ? Number(cargoQuantityMt) : undefined,
            vesselClass: vesselClass,
            targetDate: targetDate,
            currentRateUsdMt: currentRateUsdMt ? Number(currentRateUsdMt) : undefined,
        };
        const suggestions = ContextualSuggestionService_js_1.ContextualSuggestionService.getSuggestions(params);
        return res.json({ success: true, data: suggestions });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'CONTEXTUAL_SUGGESTION_ERROR', message: err.message },
        });
    }
});
exports.default = router;
//# sourceMappingURL=contextual.js.map