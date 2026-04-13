import Layout from "@/components/Layout";

const AboutUs = () => (
  <Layout>
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">About Techrola</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
        <p className="text-base">
          Techrola is India's premier platform for discovering and accessing government schemes, scholarships, and welfare programs. We empower students, farmers, minorities, and citizens to find the right schemes with ease.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Our Mission</h2>
        <p>To bridge the gap between government schemes and the citizens who need them most. We make it simple to discover, understand, and apply for 550+ schemes across India.</p>
        <h2 className="text-lg font-semibold text-foreground">What We Offer</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Comprehensive database of 550+ government schemes</li>
          <li>Direct apply links and eligibility criteria</li>
          <li>AI-powered internship report generator</li>
          <li>AI mock interview training</li>
          <li>Referral earning program</li>
        </ul>
        <h2 className="text-lg font-semibold text-foreground">Why Techrola?</h2>
        <p>We believe every citizen deserves easy access to the benefits they're entitled to. Our platform simplifies the complex world of government schemes into an easy-to-navigate experience.</p>
      </div>
    </div>
  </Layout>
);

export default AboutUs;
