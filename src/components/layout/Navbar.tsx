import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-md border-b shadow-sm" : "bg-transparent"
                }`}
        >
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3">
                    <img src="/logo.jpg" alt="BJJ Academy Pro" className="h-12 w-12 rounded-full object-cover" />
                    <span className="text-xl font-bold hidden sm:inline">BJJ Academy Pro</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#funcionalidades" className="text-foreground/80 hover:text-primary transition-colors font-medium">Funcionalidades</a>
                    <a href="#precos" className="text-foreground/80 hover:text-primary transition-colors font-medium">Preços</a>
                    <a href="#depoimentos" className="text-foreground/80 hover:text-primary transition-colors font-medium">Depoimentos</a>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/login">
                        <Button variant="ghost" className="font-medium">
                            Entrar
                        </Button>
                    </Link>
                    <Link to="/signup">
                        <Button className="font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                            Teste Grátis
                        </Button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-foreground"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 right-0 bg-background border-b shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-4">
                    <a
                        href="#funcionalidades"
                        className="text-lg font-medium p-2 hover:bg-muted rounded-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Funcionalidades
                    </a>
                    <a
                        href="#precos"
                        className="text-lg font-medium p-2 hover:bg-muted rounded-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Preços
                    </a>
                    <Link
                        to="/login"
                        className="text-lg font-medium p-2 hover:bg-muted rounded-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Entrar
                    </Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full font-bold">Teste Grátis</Button>
                    </Link>
                </div>
            )}
        </nav>
    );
}
