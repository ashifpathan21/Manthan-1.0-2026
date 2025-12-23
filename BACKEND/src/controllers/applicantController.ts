import type { Request, Response } from "express";
import Applicant from "../models/applicant.js";
import { fetchAllSocialProfiles } from "../utils/social.js";
import { checkUrlSafeBrowsing } from "../utils/threat.js";
import { analyzeSEO } from "../utils/seo.js";
import { isValidObjectId } from "../middlewares/authMiddleware.js";

export const verifyApplicantById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id) return res.status(400).json({ error: "Applicant ID is required" });
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    // Find the applicant by ID and verify ownership or admin access
    const applicant = await Applicant.findOne({ _id: id, createdBy: userId });
    if (!applicant) return res.status(404).json({ error: "Applicant not found" });

    if (!applicant.social || Object.keys(applicant.social).length === 0) {
      applicant.status = "FAILED";
      applicant.failureReason = "No social links provided";
      await applicant.save();
      return res.status(400).json({ error: "No social links provided" });
    }

    // Fetch social profiles
    const results = await fetchAllSocialProfiles(applicant.social as {
      github?: string;
      leetcode?: string;
      codeforces?: string;
      codechef?: string;
      gfg?: string;
      linkedin?: string;
    });

    applicant.authentication = results;

    // Decide verification status
    const hasValidProfile = results.some(
      r => !r.error && r.stats && Object.keys(r.stats).length > 0
    );

    applicant.status = hasValidProfile ? "VERIFIED" : "FAILED";
    if (!hasValidProfile) applicant.failureReason = "Unable to authenticate social profiles";

    await applicant.save();

    return res.status(200).json({ success: true, data: applicant });
  } catch (error: any) {
    console.error("Social verification failed", id, error?.message);
    return res.status(500).json({ success: false, error: error?.message || "Unexpected error" });
  }
};


export const projectAnalysis = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Please Provide URL of Project"
      })
    }

    const threat = await checkUrlSafeBrowsing(url);
    const seo = await analyzeSEO(url);

    return res.status(200).json({
      success: true,
      data: {
        isSafe: !threat,
        threat,
        seo
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error
    })
  }
}


export const getById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    if (!userId || !isValidObjectId(userId) || !id || !isValidObjectId(id)) {
      return res.status(501).json({
        success: false,
        message: "Unauthorized"
      })
    }

    const applicant = await Applicant.findOne({ _id: id, createdBy: userId }).populate("resume").exec()
    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: "Applicant Not Found"
      })
    }

    return res.status(200).json({
      success: true,
      data: applicant
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "INTERNAL SERVER ERROR"
    })
  }
}