import Layout from "@/components/Layout";
import { Mail, Phone, MapPin } from "lucide-react";

const ContactUs = () => (
  <Layout>
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Contact Us</h1>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Email</h3>
            <p className="text-muted-foreground text-sm">omlaytechnologies@gmail.com</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Phone</h3>
            <p className="text-muted-foreground text-sm">7899666679</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Address</h3>
            <p className="text-muted-foreground text-sm">India</p>
          </div>
        </div>
      </div>
    </div>
  </Layout>
);

export default ContactUs;
