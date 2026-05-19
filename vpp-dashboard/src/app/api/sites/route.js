import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Site from "@/models/Site";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { siteName, siteType, formData } = body;

    if (!siteName) {
      return NextResponse.json(
        { error: "Site name is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    let dbUserId = session.user.id;
    // If the cookie is stale and missing the ID, look them up by email
    if (!dbUserId) {
      const userRecord = await User.findOne({ email: session.user.email });
      if (!userRecord) {
        return NextResponse.json(
          { error: "User record not found in database" },
          { status: 404 },
        );
      }
      dbUserId = userRecord._id;
    }
    const newSite = await Site.create({
      userId: dbUserId,
      siteName: siteName,
      siteType: siteType,

      configuration: {
        location: {
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
        battery: formData.battery_capacity_mwh
          ? {
              battery_capacity_mwh: formData.battery_capacity_mwh,
              initial_soc_mwh: formData.initial_soc_mwh,
              min_soc_mwh: formData.min_soc_mwh,
              max_charge_mw: formData.max_charge_mw,
              max_discharge_mw: formData.max_discharge_mw,
            }
          : null,
        solar:
          siteType === "solar_battery" || siteType === "optimization"
            ? {
                capacity_mw: formData.capacity_mw,
                panel_area_m2: formData.panel_area_m2,
                panel_efficiency: formData.panel_efficiency,
                inverter_efficiency: formData.inverter_efficiency,
                system_loss_factor: formData.system_loss_factor,
              }
            : null,
        wind:
          siteType === "wind_battery" || siteType === "optimization"
            ? {
                num_turbines: formData.num_turbines,
                turbine_capacity_mw: formData.turbine_capacity_mw,
                hub_height_m: formData.hub_height_m,
                terrain_type: formData.terrain_type,
                cut_in_m_s: formData.cut_in_m_s,
                rated_m_s: formData.rated_m_s,
                cut_out_m_s: formData.cut_out_m_s,
              }
            : null,
      },
    });
    return NextResponse.json({ success: true, site: newSite }, { status: 200 });
  } catch (error) {
    console.error("Save Site Error:", error);
    return NextResponse.json({ error: "Failed to save site" }, { status: 500 });
  }
}
