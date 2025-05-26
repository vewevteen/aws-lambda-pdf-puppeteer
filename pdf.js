"use strict";
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

module.exports.pdf = async (event, context) => {
  let html = "";

  // ✅ event.isBase64Encoded 체크
  if (event.body) {
    if (event.isBase64Encoded) {
      html = Buffer.from(event.body, "base64").toString("utf-8");
    } else {
      html = event.body;
    }
  } else {
    console.error("No body found");
    return context.fail("No body found");
  }

  // ✅ termName 파라미터 받기 (queryStringParameters 기준)
  const termName =
    (event.queryStringParameters && event.queryStringParameters.termName) ||
    "document";

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: "1.8cm", right: "1cm", bottom: "1cm", left: "1cm" },
    });

    const response = {
      headers: {
        "Content-type": "application/pdf",
        "content-disposition": `attachment; filename=${termName}.pdf`,
      },
      statusCode: 200,
      body: pdf.toString("base64"),
      isBase64Encoded: true,
    };

    context.succeed(response);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return context.fail(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};
